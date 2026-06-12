import { supabase } from "@/integrations/supabase/client";

export interface LogEventInput {
  kind: string;
  title: string;
  detail?: string;
  url?: string;
  actor?: string;
  color?: number;
}

export async function logWebsiteEvent(input: LogEventInput): Promise<void> {
  try {
    await supabase.functions.invoke("website-log-event", { body: input });
  } catch (e) {
    // Non-fatal: webhook logging should never break the UX
    console.warn("logWebsiteEvent failed", e);
  }
}
