import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Accepts either a raw storage path or a legacy absolute public URL and
// normalises it to the object path inside the given bucket.
function normalisePath(bucket: string, input: string): string | null {
  if (!input) return null;
  let value = input.trim();
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = value.indexOf(marker);
  if (idx >= 0) value = value.slice(idx + marker.length);
  value = value.split("?")[0];
  if (!value || value.includes("..")) return null;
  try {
    value = decodeURIComponent(value);
  } catch {
    /* keep as-is */
  }
  return value;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { path: rawPath } = await req.json();
    const bucket = "plugin-jars";
    const path = normalisePath(bucket, String(rawPath ?? ""));
    if (!path) return json({ error: "Missing file path" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Who is asking (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    // Find the plugin this file belongs to
    let pluginId: string | null = null;
    const { data: direct } = await admin
      .from("plugins")
      .select("id")
      .eq("jar_path", path)
      .maybeSingle();
    if (direct) pluginId = direct.id;

    if (!pluginId) {
      const { data: ver } = await admin
        .from("plugin_versions")
        .select("plugin_id")
        .eq("jar_path", path)
        .maybeSingle();
      if (ver) pluginId = ver.plugin_id;
    }

    if (!pluginId) return json({ error: "File not found" }, 404);

    const { data: plugin } = await admin
      .from("plugins")
      .select("id, published, user_id, org_id")
      .eq("id", pluginId)
      .maybeSingle();
    if (!plugin) return json({ error: "File not found" }, 404);

    let allowed = plugin.published === true;

    if (!allowed && userId) {
      if (plugin.user_id === userId) {
        allowed = true;
      } else {
        const [{ data: isAdmin }, { data: member }] = await Promise.all([
          admin.rpc("has_role", { _user_id: userId, _role: "admin" }).then(
            (r) => r,
            () => ({ data: null }),
          ),
          plugin.org_id
            ? admin
                .from("organization_members")
                .select("user_id")
                .eq("org_id", plugin.org_id)
                .eq("user_id", userId)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);
        allowed = isAdmin === true || !!member;
      }
    }

    if (!allowed) return json({ error: "Not authorised to download this file" }, 403);

    const { data: signed, error } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, 300, { download: true });

    if (error || !signed?.signedUrl) {
      return json({ error: error?.message ?? "Could not create download link" }, 500);
    }

    return json({ url: signed.signedUrl });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
