import { createClient } from "npm:@supabase/supabase-js@2";

function html(message: string, returnTo: string | null, ok: boolean) {
  const target = returnTo || "/profile";
  return `<!doctype html><html><head><meta charset="utf-8"><title>Discord Link</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0a0a14;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px}
.card{max-width:420px;padding:32px;border:1px solid #2a2a3a;border-radius:16px;background:#12121e}
h1{margin:0 0 12px;font-size:22px;color:${ok ? "#7ee787" : "#ff7b72"}}
p{color:#a1a1aa;margin:0 0 20px}
a{display:inline-block;padding:10px 20px;background:#5865f2;color:#fff;border-radius:8px;text-decoration:none;font-weight:600}</style>
</head><body><div class="card"><h1>${ok ? "Discord linked!" : "Link failed"}</h1>
<p>${message}</p><a href="${target}">Continue</a>
<script>setTimeout(()=>{location.href=${JSON.stringify(target)}},1500)</script>
</div></body></html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  let returnTo: string | null = null;
  let stateToken = stateParam;
  if (stateParam?.includes(".")) {
    const [s, rt] = stateParam.split(".");
    stateToken = s;
    try { returnTo = atob(rt); } catch { /* ignore */ }
  }

  if (error || !code || !stateToken) {
    return new Response(html(error || "Missing code/state.", returnTo, false), {
      status: 400, headers: { "Content-Type": "text/html" },
    });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: stateRow, error: stateErr } = await admin
      .from("discord_link_states").select("user_id, expires_at")
      .eq("state", stateToken).maybeSingle();
    if (stateErr || !stateRow) {
      return new Response(html("Invalid or expired state.", returnTo, false), {
        status: 400, headers: { "Content-Type": "text/html" },
      });
    }
    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      await admin.from("discord_link_states").delete().eq("state", stateToken);
      return new Response(html("State expired. Please try again.", returnTo, false), {
        status: 400, headers: { "Content-Type": "text/html" },
      });
    }
    await admin.from("discord_link_states").delete().eq("state", stateToken);

    const clientId = Deno.env.get("DISCORD_APPLICATION_ID")!;
    const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/discord-link-callback`;

    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return new Response(html(`Discord token exchange failed: ${t}`, returnTo, false), {
        status: 400, headers: { "Content-Type": "text/html" },
      });
    }
    const tok = await tokenRes.json();

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    });
    if (!userRes.ok) {
      return new Response(html("Could not fetch Discord profile.", returnTo, false), {
        status: 400, headers: { "Content-Type": "text/html" },
      });
    }
    const du = await userRes.json();

    const { error: updErr } = await admin.from("profiles").update({
      discord_id: du.id,
      discord_username: du.global_name || du.username,
      discord_avatar: du.avatar
        ? `https://cdn.discordapp.com/avatars/${du.id}/${du.avatar}.png`
        : null,
    }).eq("id", stateRow.user_id);

    if (updErr) {
      const msg = updErr.message.includes("duplicate")
        ? "That Discord account is already linked to another user."
        : updErr.message;
      return new Response(html(msg, returnTo, false), {
        status: 400, headers: { "Content-Type": "text/html" },
      });
    }

    return new Response(
      html(`Linked as ${du.global_name || du.username}.`, returnTo, true),
      { headers: { "Content-Type": "text/html" } },
    );
  } catch (e) {
    return new Response(html(String(e), returnTo, false), {
      status: 500, headers: { "Content-Type": "text/html" },
    });
  }
});
