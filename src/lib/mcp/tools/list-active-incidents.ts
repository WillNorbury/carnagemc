import { createClient } from "@supabase/supabase-js";
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_active_incidents",
  title: "List active incidents",
  description:
    "List currently open (unresolved) uptime incidents affecting the tracked services.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .describe("Maximum number of incidents to return (default 20).")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const cap = Math.min(Math.max(limit ?? 20, 1), 100);
    const { data, error } = await supabase
      .from("uptime_incidents")
      .select("id,service_key,title,severity,started_at,resolved_at,notes")
      .is("resolved_at", null)
      .order("started_at", { ascending: false })
      .limit(cap);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { incidents: data ?? [] },
    };
  },
});
