import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_my_tickets",
  title: "List my support tickets",
  description:
    "List the signed-in user's support tickets. Row-level security ensures only the caller's own tickets are returned.",
  inputSchema: {
    status: z
      .enum(["open", "pending", "closed"])
      .describe("Optional status filter.")
      .optional(),
    limit: z
      .number()
      .int()
      .describe("Maximum number of tickets to return (default 20).")
      .optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx: ToolContext) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const cap = Math.min(Math.max(limit ?? 20, 1), 100);
    let query = supabase
      .from("support_tickets")
      .select("id,subject,status,priority,created_at,updated_at")
      .order("updated_at", { ascending: false })
      .limit(cap);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tickets: data ?? [] },
    };
  },
});
