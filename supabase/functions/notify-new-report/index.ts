import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ALERT_EMAIL = Deno.env.get("ALERT_EMAIL") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { report_id } = await req.json().catch(() => ({}));
    if (!report_id || typeof report_id !== "string") {
      return new Response(JSON.stringify({ error: "report_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const { data: report, error } = await admin
      .from("user_reports")
      .select("*")
      .eq("id", report_id)
      .maybeSingle();
    if (error) throw error;
    if (!report) {
      return new Response(JSON.stringify({ error: "report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALERT_EMAIL) {
      return new Response(
        JSON.stringify({ ok: true, emailed: false, reason: "ALERT_EMAIL not set" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let reporterName = "anonymous";
    if (report.reporter_id) {
      const { data: profile } = await admin
        .from("profiles")
        .select("display_name")
        .eq("id", report.reporter_id)
        .maybeSingle();
      reporterName = profile?.display_name ?? report.reporter_id.slice(0, 8);
    }

    const { error: sendErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "report-admin",
        recipientEmail: ALERT_EMAIL,
        idempotencyKey: `report-admin-${report.id}`,
        templateData: {
          targetType: report.target_type,
          targetLabel: report.target_label ?? report.target_id ?? "unknown",
          targetUrl: report.target_url ?? "",
          reason: report.reason,
          details: report.details ?? "",
          reporterName,
          adminUrl: "https://carnagemc.net/admin?tab=reports",
        },
      },
    });
    if (sendErr) throw sendErr;

    return new Response(JSON.stringify({ ok: true, emailed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("notify-new-report error", err);
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
