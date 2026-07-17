import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getServerStatus from "./tools/get-server-status";
import listActiveIncidents from "./tools/list-active-incidents";
import getMyProfile from "./tools/get-my-profile";
import listMyTickets from "./tools/list-my-tickets";

// Build the OAuth issuer from the direct Supabase project ref (never SUPABASE_URL,
// which may point at a Lovable Cloud proxy). VITE_SUPABASE_PROJECT_ID is inlined
// as a literal by Vite at build time, so this stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "havocsmp-mcp",
  title: "HavocSMP MCP",
  version: "0.1.0",
  instructions:
    "Tools for the HavocSMP / Carnage community website. Use get_server_status and list_active_incidents for public read-only checks; use get_my_profile and list_my_tickets to act on the signed-in user's own data (RLS-scoped).",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getServerStatus, listActiveIncidents, getMyProfile, listMyTickets],
});
