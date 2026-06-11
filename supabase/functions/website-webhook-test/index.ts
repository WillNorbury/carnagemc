import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Validate caller is admin/owner
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
  const { data: u } = await userClient.auth.getUser();
  if (!u?.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin" || r.role === "owner");
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let kind: "up" | "down" = "down";
  try {
    const body = await req.json();
    if (body?.kind === "up" || body?.kind === "down") kind = body.kind;
  } catch { /* ignore */ }

  // Load webhook URL
  const { data: sc } = await admin.from("site_content").select("value").eq("key", "status_page").maybeSingle();
  const v = (sc?.value ?? {}) as { website_webhook_url?: string };
  const url = (v.website_webhook_url || "").trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return new Response(JSON.stringify({ error: "No website webhook URL configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const ts = new Date().toISOString();
  const payload = kind === "down"
    ? {
        username: "Uptime Monitor",
        embeds: [{
          title: "🔴 Website is DOWN (TEST)",
          description: `This is a test payload sent from the admin panel.\n**Uptime (24h):** 99.00%\n**Error:** Test error message`,
          color: 0xef4444,
          timestamp: ts,
        }],
      }
    : {
        username: "Uptime Monitor",
        embeds: [{
          title: "🟢 Website recovered (TEST)",
          description: `This is a test payload sent from the admin panel.\n**Uptime (24h):** 99.00%\n**Incident lasted:** 1m`,
          color: 0x22c55e,
          timestamp: ts,
        }],
      };

  const start = Date.now();
  let status: number | null = null;
  let ok = false;
  let error: string | null = null;
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    await r.arrayBuffer().catch(() => {});
    status = r.status;
    ok = r.ok;
    if (!ok) error = `HTTP ${r.status}`;
  } catch (e) {
    error = String((e as Error).message || e).slice(0, 300);
  }
  const latency_ms = Date.now() - start;

  let host: string | null = null;
  try { host = new URL(url).host; } catch { /* ignore */ }

  await admin.from("website_webhook_deliveries").insert({
    kind: `test_${kind}`,
    url_host: host,
    status_code: status,
    ok,
    error,
    latency_ms,
  });

  return new Response(JSON.stringify({ ok, status, error, latency_ms }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
