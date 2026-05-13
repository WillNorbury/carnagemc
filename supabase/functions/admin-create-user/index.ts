// Admin-only edge function to create a new user
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify caller is admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, display_name, mc_username, is_admin, roles } = body ?? {};
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "email and password required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: display_name ?? email.split("@")[0],
      },
    });
    if (createErr || !created.user) {
      return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create user" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newId = created.user.id;

    // Patch profile mc_username/display_name (handle_new_user trigger should have created the row)
    if (mc_username || display_name) {
      await admin
        .from("profiles")
        .update({
          ...(display_name ? { display_name } : {}),
          ...(mc_username ? { mc_username } : {}),
        })
        .eq("id", newId);
    }

    // Collect roles to assign (dedup, drop "default" since trigger already inserts it)
    const roleSet = new Set<string>(Array.isArray(roles) ? roles : []);
    if (is_admin) roleSet.add("admin");
    roleSet.delete("default");

    if (roleSet.size > 0) {
      // Remove any existing rows for these roles to avoid unique conflicts, then insert
      await admin
        .from("user_roles")
        .delete()
        .eq("user_id", newId)
        .in("role", [...roleSet]);
      const { error: roleErr } = await admin
        .from("user_roles")
        .insert([...roleSet].map((role) => ({ user_id: newId, role })));
      if (roleErr) {
        return new Response(
          JSON.stringify({ ok: true, user_id: newId, role_error: roleErr.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    return new Response(JSON.stringify({ ok: true, user_id: newId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
