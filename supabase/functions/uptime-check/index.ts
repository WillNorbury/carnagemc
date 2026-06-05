import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Check = {
  service_key: string;
  is_up: boolean;
  latency_ms: number | null;
  status_code: number | null;
  error: string | null;
};

const SERVICE_NAMES: Record<string, string> = {
  website: "Website",
  minecraft: "Minecraft Server",
  api: "API",
  panel: "Panel",
};

async function checkHttp(service_key: string, url: string, expectOk = true, headers: Record<string, string> = {}): Promise<Check> {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10_000);
    const r = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers });
    clearTimeout(t);
    await r.arrayBuffer().catch(() => {});
    return {
      service_key,
      is_up: expectOk ? r.ok : r.status < 500,
      latency_ms: Date.now() - start,
      status_code: r.status,
      error: null,
    };
  } catch (e) {
    return {
      service_key,
      is_up: false,
      latency_ms: Date.now() - start,
      status_code: null,
      error: String((e as Error).message || e).slice(0, 300),
    };
  }
}

async function checkMinecraft(service_key: string, host: string): Promise<Check> {
  const start = Date.now();
  try {
    const r = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(host)}`);
    const j = await r.json();
    return {
      service_key,
      is_up: !!j.online,
      latency_ms: Date.now() - start,
      status_code: r.status,
      error: j.online ? null : "offline",
    };
  } catch (e) {
    return {
      service_key,
      is_up: false,
      latency_ms: Date.now() - start,
      status_code: null,
      error: String((e as Error).message || e).slice(0, 300),
    };
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}d ${remHours}h ${mins}m`;
}

function interpolateTemplate(template: unknown, vars: Record<string, string>): unknown {
  if (typeof template === "string") {
    return template.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => vars[key] ?? `{{${key}}}`);
  }
  if (Array.isArray(template)) {
    return template.map((item) => interpolateTemplate(item, vars));
  }
  if (template && typeof template === "object") {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(template as Record<string, unknown>)) {
      obj[k] = interpolateTemplate(v, vars);
    }
    return obj;
  }
  return template;
}

async function sendWebhook(
  urls: string[],
  template: unknown,
  vars: Record<string, string>,
  fallbackBody: object,
) {
  if (urls.length === 0) return;
  const payload = template ? interpolateTemplate(template, vars) : fallbackBody;
  const body = JSON.stringify(payload);
  await Promise.all(urls.map(async (url) => {
    try {
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    } catch (e) {
      console.error("webhook failed", url, e);
    }
  }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Load alert settings
  const { data: alertSettings } = await supabase
    .from("alert_settings")
    .select("webhook_urls, down_payload_template, up_payload_template")
    .eq("id", 1)
    .maybeSingle();

  const webhookUrls = (alertSettings?.webhook_urls ?? []) as string[];
  const envUrls = (Deno.env.get("ALERT_WEBHOOK_URL") || "")
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
  const allUrls = [...new Set([...webhookUrls, ...envUrls])];

  let mcHost = "play.havocsmp.net";
  try {
    const { data } = await supabase.from("site_content").select("value").eq("key", "server").maybeSingle();
    const v = data?.value as { ip?: string } | null;
    if (v?.ip) mcHost = v.ip;
  } catch { /* ignore */ }

  const siteUrl = "https://www.havocsmp.net";
  const apiHealth = `${SUPABASE_URL}/rest/v1/`;

  const checks = await Promise.all([
    checkHttp("website", siteUrl),
    checkMinecraft("minecraft", mcHost),
    checkHttp("api", apiHealth, false),
    checkHttp("panel", "https://panel.voxelnode.dev"),
  ]);

  const { error: insertErr } = await supabase.from("uptime_checks").insert(checks);
  if (insertErr) {
    return new Response(JSON.stringify({ ok: false, error: insertErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Compute uptime window (last 24h) for each service
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentChecks } = await supabase
    .from("uptime_checks")
    .select("service_key, is_up")
    .gte("checked_at", since24h);

  const uptimeByService = new Map<string, { total: number; up: number }>();
  for (const c of (recentChecks ?? [])) {
    const s = uptimeByService.get(c.service_key) ?? { total: 0, up: 0 };
    s.total++;
    if (c.is_up) s.up++;
    uptimeByService.set(c.service_key, s);
  }

  // Alerting: open/close incidents
  const alerts: { service: string; kind: "down" | "up" }[] = [];
  for (const c of checks) {
    const name = SERVICE_NAMES[c.service_key] || c.service_key;
    const { data: openIncident } = await supabase
      .from("uptime_incidents")
      .select("id, alerted, opened_at")
      .eq("service_key", c.service_key)
      .is("closed_at", null)
      .maybeSingle();

    const uptimeRec = uptimeByService.get(c.service_key);
    const uptimePct = uptimeRec && uptimeRec.total > 0
      ? `${(100 * uptimeRec.up / uptimeRec.total).toFixed(2)}%`
      : "N/A";

    if (!c.is_up) {
      // Check last 2 checks for this service to require 2+ consecutive failures
      const { data: recent } = await supabase
        .from("uptime_checks")
        .select("is_up")
        .eq("service_key", c.service_key)
        .order("checked_at", { ascending: false })
        .limit(2);
      const twoDown = (recent?.length ?? 0) >= 2 && recent!.every((r) => !r.is_up);

      if (!openIncident && twoDown) {
        const { data: inc } = await supabase
          .from("uptime_incidents")
          .insert({ service_key: c.service_key, last_error: c.error })
          .select("id, opened_at")
          .single();
        if (inc) {
          const duration = formatDuration(0);
          const vars: Record<string, string> = {
            service_name: name,
            service_key: c.service_key,
            status: "DOWN",
            uptime_window: uptimePct,
            incident_duration: duration,
            error: c.error || "Unknown error",
            timestamp: new Date().toISOString(),
          };
          const fallback = {
            username: "Uptime Monitor",
            embeds: [{
              title: `🔴 ${name} is DOWN`,
              description: `Service has failed multiple consecutive checks.\n**Uptime (24h):** ${uptimePct}\n**Error:** ${c.error || "Unknown error"}`,
              color: 0xef4444,
              timestamp: new Date().toISOString(),
            }],
          };
          await sendWebhook(allUrls, alertSettings?.down_payload_template, vars, fallback);
          await supabase.from("uptime_incidents").update({ alerted: true }).eq("id", inc.id);
          alerts.push({ service: c.service_key, kind: "down" });
        }
      } else if (openIncident && !openIncident.alerted) {
        const durMin = (Date.now() - new Date(openIncident.opened_at).getTime()) / 60000;
        const duration = formatDuration(durMin);
        const vars: Record<string, string> = {
          service_name: name,
          service_key: c.service_key,
          status: "DOWN",
          uptime_window: uptimePct,
          incident_duration: duration,
          error: c.error || "Unknown error",
          timestamp: new Date().toISOString(),
        };
        const fallback = {
          username: "Uptime Monitor",
          embeds: [{
            title: `🔴 ${name} is DOWN`,
            description: `Service has failed multiple consecutive checks.\n**Uptime (24h):** ${uptimePct}\n**Incident duration:** ${duration}\n**Error:** ${c.error || "Unknown error"}`,
            color: 0xef4444,
            timestamp: new Date().toISOString(),
          }],
        };
        await sendWebhook(allUrls, alertSettings?.down_payload_template, vars, fallback);
        await supabase.from("uptime_incidents").update({ alerted: true, last_error: c.error }).eq("id", openIncident.id);
        alerts.push({ service: c.service_key, kind: "down" });
      }
    } else if (openIncident) {
      await supabase.from("uptime_incidents").update({ closed_at: new Date().toISOString() }).eq("id", openIncident.id);
      if (openIncident.alerted) {
        const durMin = (Date.now() - new Date(openIncident.opened_at).getTime()) / 60000;
        const duration = formatDuration(durMin);
        const vars: Record<string, string> = {
          service_name: name,
          service_key: c.service_key,
          status: "UP",
          uptime_window: uptimePct,
          incident_duration: duration,
          error: "",
          timestamp: new Date().toISOString(),
        };
        const fallback = {
          username: "Uptime Monitor",
          embeds: [{
            title: `🟢 ${name} recovered`,
            description: `Service is responding successfully again.\n**Uptime (24h):** ${uptimePct}\n**Incident lasted:** ${duration}`,
            color: 0x22c55e,
            timestamp: new Date().toISOString(),
          }],
        };
        await sendWebhook(allUrls, alertSettings?.up_payload_template, vars, fallback);
        alerts.push({ service: c.service_key, kind: "up" });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, checks, alerts }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});