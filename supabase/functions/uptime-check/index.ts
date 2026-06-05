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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Read MC server IP from site_content if present
  let mcHost = "play.havocsmp.net";
  try {
    const { data } = await supabase.from("site_content").select("value").eq("key", "server").maybeSingle();
    const v = data?.value as { ip?: string } | null;
    if (v?.ip) mcHost = v.ip;
  } catch {}

  const siteUrl = "https://www.havocsmp.net";
  // Any < 500 response means the API gateway is alive
  const apiHealth = `${SUPABASE_URL}/rest/v1/`;

  const checks = await Promise.all([
    checkHttp("website", siteUrl),
    checkMinecraft("minecraft", mcHost),
    checkHttp("api", apiHealth, false),
    checkHttp("panel", "https://panel.voxelnode.dev"),
  ]);

  const { error } = await supabase.from("uptime_checks").insert(checks);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, checks }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
