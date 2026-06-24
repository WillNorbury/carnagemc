import { supabase } from "@/integrations/supabase/client";

export type ReportTargetType =
  | "user"
  | "plugin"
  | "mod"
  | "resource_pack"
  | "data_pack"
  | "shader"
  | "modpack"
  | "server"
  | "news"
  | "wiki"
  | "comment"
  | "other";

export type SubmitReportInput = {
  targetType: ReportTargetType;
  targetId?: string | null;
  targetLabel?: string | null;
  targetUrl?: string | null;
  reason: string;
  details?: string | null;
};

/**
 * Submits a new user report. The DB trigger creates an in-app notification
 * for every admin. If ALERT_EMAIL is set, an admin notification email is
 * also dispatched via the notify-new-report edge function.
 */
export const submitReport = async (input: SubmitReportInput) => {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("You must be signed in to submit a report");

  const { data, error } = await supabase
    .from("user_reports")
    .insert({
      reporter_id: uid,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      target_label: input.targetLabel ?? null,
      target_url: input.targetUrl ?? null,
      reason: input.reason,
      details: input.details ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  // Fire-and-forget email notification — failure shouldn't block the report.
  supabase.functions
    .invoke("notify-new-report", { body: { report_id: data.id } })
    .catch((e) => console.warn("notify-new-report failed", e));

  return data.id as string;
};
