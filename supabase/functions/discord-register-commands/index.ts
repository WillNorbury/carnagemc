// One-shot helper to register the /rules slash command globally.
// Invoke from the admin tab; admin-only.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return json({ ok: false, error: "Unauthorized" }, 401);
    const { data: role } = await userClient
      .from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ ok: false, error: "Admin only" }, 403);

    const appId = Deno.env.get("DISCORD_APPLICATION_ID");
    const token = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!appId || !token) return json({ ok: false, error: "Missing DISCORD_APPLICATION_ID or DISCORD_BOT_TOKEN" }, 400);

    const cmds = [{ name: "rules", description: "Show the HavocSMP server rules", type: 1 }];
    const r = await fetch(`https://discord.com/api/v10/applications/${appId}/commands`, {
      method: "PUT",
      headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(cmds),
    });
    const data = await r.json().catch(() => ({}));
    return json(r.ok ? { ok: true, registered: data } : { ok: false, status: r.status, details: data }, r.ok ? 200 : 500);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
