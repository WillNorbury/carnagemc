import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Payload {
  kind: string;
  title: string;
  detail?: string;
  url?: string;
  actor?: string;
  color?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    if (!body?.kind || !body?.title) {
      return new Response(JSON.stringify({ error: "kind and title required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve webhook URL
    const { data: setting } = await supabase
      .from("alert_settings")
      .select("value")
      .eq("key", "website_webhook")
      .maybeSingle();

    const url = (setting?.value as { website_webhook_url?: string } | null)?.website_webhook_url;
    if (!url || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ skipped: true, reason: "no webhook url" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = {
      embeds: [
        {
          title: body.title,
          description: body.detail ?? "",
          color: body.color ?? 0x3b82f6,
          url: body.url,
          fields: [
            { name: "Event", value: body.kind, inline: true },
            ...(body.actor ? [{ name: "By", value: body.actor, inline: true }] : []),
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const started = Date.now();
    let status = 0;
    let ok = false;
    let error: string | null = null;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      status = resp.status;
      ok = resp.ok;
      if (!resp.ok) error = await resp.text().catch(() => `HTTP ${resp.status}`);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    const latency_ms = Date.now() - started;

    await supabase.from("website_webhook_deliveries").insert({
      kind: body.kind,
      url_host: (() => {
        try { return new URL(url).host; } catch { return null; }
      })(),
      status_code: status || null,
      ok,
      error,
      latency_ms,
    });

    return new Response(JSON.stringify({ ok, status, error, latency_ms }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
