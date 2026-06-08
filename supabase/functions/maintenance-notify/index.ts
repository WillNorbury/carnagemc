import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { enabled, title, message } = await req.json().catch(() => ({}));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: alertSettings } = await supabase
      .from("alert_settings")
      .select("webhook_urls")
      .eq("id", 1)
      .maybeSingle();

    const webhookUrls = (alertSettings?.webhook_urls ?? []) as string[];
    const envUrls = (Deno.env.get("ALERT_WEBHOOK_URL") || "")
      .split(/[\s,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//i.test(s));
    const allUrls = [...new Set([...webhookUrls, ...envUrls])];

    const isOn = enabled !== false;
    const headline = isOn ? "🛠️ Website Maintenance" : "✅ Website back online";
    const desc = isOn
      ? (message || "HavocSMP is entering maintenance mode. The site is temporarily unavailable to visitors. Status page remains accessible at /status.")
      : "Maintenance mode has been disabled. The site is fully accessible again.";

    const payload = {
      content: headline,
      embeds: [
        {
          title: title || headline,
          description: desc,
          color: isOn ? 0xf59e0b : 0x22c55e,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const body = JSON.stringify(payload);
    const results = await Promise.all(
      allUrls.map(async (url) => {
        try {
          const r = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body,
          });
          return { url, ok: r.ok, status: r.status };
        } catch (e) {
          return { url, ok: false, error: String(e) };
        }
      }),
    );

    return new Response(JSON.stringify({ sent: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
