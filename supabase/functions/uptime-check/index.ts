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

async function sendWebhook(name: string, error: string | null, kind: "down" | "up") {
  const raw = Deno.env.get("ALERT_WEBHOOK_URL") || "";
  const urls = raw.split(/[\s,;\n]+/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
  if (urls.length === 0) return;
  const color = kind === "down" ? 0xef4444 : 0x22c55e;
  const title = kind === "down" ? `🔴 ${name} is DOWN` : `🟢 ${name} recovered`;
  const description = kind === "down"
    ? `Service has failed multiple consecutive checks.${error ? `\n**Error:** ${error}` : ""}`
    : `Service is responding successfully again.`;
  const body = JSON.stringify({
    username: "Uptime Monitor",
    embeds: [{ title, description, color, timestamp: new Date().toISOString() }],
  });
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

  let mcHost = "play.havocsmp.net";
  try {
    const { data } = await supabase.from("site_content").select("value").eq("key", "server").maybeSingle();
    const v = data?.value as { ip?: string } | null;
    if (v?.ip) mcHost = v.ip;
  } catch {}

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

  // Alerting: open/close incidents
  const alerts: { service: string; kind: "down" | "up" }[] = [];
  for (const c of checks) {
    const name = SERVICE_NAMES[c.service_key] || c.service_key;
    const { data: openIncident } = await supabase
      .from("uptime_incidents")
      .select("id, alerted")
      .eq("service_key", c.service_key)
      .is("closed_at", null)
      .maybeSingle();

    if (!c.is_up) {
      // Check last 2 checks (including current) for this service to require 2+ consecutive failures
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
          .select("id")
          .single();
        if (inc) {
          await sendWebhook(name, c.error, "down");
          await supabase.from("uptime_incidents").update({ alerted: true }).eq("id", inc.id);
          alerts.push({ service: c.service_key, kind: "down" });
        }
      } else if (openIncident && !openIncident.alerted) {
        await sendWebhook(name, c.error, "down");
        await supabase.from("uptime_incidents").update({ alerted: true, last_error: c.error }).eq("id", openIncident.id);
        alerts.push({ service: c.service_key, kind: "down" });
      }
    } else if (openIncident) {
      await supabase.from("uptime_incidents").update({ closed_at: new Date().toISOString() }).eq("id", openIncident.id);
      if (openIncident.alerted) {
        await sendWebhook(name, null, "up");
        alerts.push({ service: c.service_key, kind: "up" });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, checks, alerts }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
