import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Action = "announce" | "status" | "welcome";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function discordPost(channelId: string, token: string, payload: unknown) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ ok: false, error: "Unauthorized" }, 401);

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ ok: false, error: "Forbidden — admin only" }, 403);

    const token = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!token) return json({ ok: false, error: "DISCORD_BOT_TOKEN secret is not configured" });

    const body = await req.json().catch(() => ({}));
    const action: Action = body?.action;
    if (!["announce", "status", "welcome"].includes(action)) {
      return json({ ok: false, error: "Invalid action" }, 400);
    }

    // Load saved bot config
    const { data: cfgRow } = await supabase
      .from("site_content")
      .select("value")
      .eq("key", "discord_bot")
      .maybeSingle();
    const cfg: any = cfgRow?.value ?? {};

    // Load server status for status action
    let server: any = null;
    if (action === "status") {
      const { data } = await supabase
        .from("server_status")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      server = data;
    }

    if (action === "announce") {
      const channelId = body.channelId || cfg.announceChannelId;
      const message = body.message || "📢 **Test announcement** from the ZyphoraMC admin panel.";
      if (!channelId) return json({ ok: false, error: "No announcements channel configured" });
      const r = await discordPost(channelId, token, {
        embeds: [{
          title: "Announcement",
          description: message,
          color: 0x5865f2,
          footer: { text: "ZyphoraMC · Test" },
          timestamp: new Date().toISOString(),
        }],
      });
      return json(r.ok
        ? { ok: true, message: `Announcement sent to channel ${channelId}` }
        : { ok: false, error: `Discord error ${r.status}`, details: r.data });
    }

    if (action === "status") {
      const channelId = body.channelId || cfg.statusChannelId;
      if (!channelId) return json({ ok: false, error: "No status channel configured" });
      const online = !!server?.online;
      const r = await discordPost(channelId, token, {
        embeds: [{
          title: "🟢 Server Status",
          color: online ? 0x22c55e : 0xef4444,
          fields: [
            { name: "Status", value: online ? "Online" : "Offline", inline: true },
            { name: "Players", value: `${server?.players_online ?? 0} / ${server?.players_max ?? 0}`, inline: true },
            { name: "MOTD", value: server?.motd || "—", inline: false },
          ],
          footer: { text: "ZyphoraMC · Live status" },
          timestamp: new Date().toISOString(),
        }],
      });
      return json(r.ok
        ? { ok: true, message: `Status posted to channel ${channelId}` }
        : { ok: false, error: `Discord error ${r.status}`, details: r.data });
    }

    if (action === "welcome") {
      // Welcome target: prefer announce channel for the preview, then status
      const channelId = body.channelId || cfg.announceChannelId || cfg.statusChannelId;
      if (!channelId) return json({ ok: false, error: "No channel configured to preview welcome message" });
      const template = body.message || cfg.welcomeMessage || "Welcome to ZyphoraMC, {user}!";
      const username = userData.user.user_metadata?.display_name || userData.user.email || "tester";
      const rendered = template.replace(/\{user\}/g, `**${username}**`);
      const r = await discordPost(channelId, token, {
        content: `👋 *Welcome message preview:*\n${rendered}`,
      });
      return json(r.ok
        ? { ok: true, message: `Welcome preview sent to channel ${channelId}` }
        : { ok: false, error: `Discord error ${r.status}`, details: r.data });
    }

    return json({ ok: false, error: "Unhandled action" }, 400);
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500);
  }
});
