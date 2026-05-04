import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
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
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function discordPatch(channelId: string, messageId: string, token: string, payload: unknown) {
  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${messageId}`, {
    method: "PATCH",
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function buildStatusEmbed(mc: any, serverIp: string) {
  const online = !!mc?.online;
  const motd = Array.isArray(mc?.motd?.clean) ? mc.motd.clean.join(" ") : null;
  const version = mc?.version ?? "—";
  const players = `${mc?.players?.online ?? 0} / ${mc?.players?.max ?? 0}`;
  return {
    title: online ? "🟢 ZyphoraMC — Online" : "🔴 ZyphoraMC — Offline",
    description: motd ? `*${motd}*` : undefined,
    color: online ? 0x22c55e : 0xef4444,
    fields: [
      { name: "Status", value: online ? "Live" : "Down", inline: true },
      { name: "Players", value: players, inline: true },
      { name: "Version", value: String(version), inline: true },
      { name: "IP", value: `\`${serverIp}\``, inline: false },
    ],
    footer: { text: "ZyphoraMC · Live status (auto-updated)" },
    timestamp: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const cronSecret = req.headers.get("x-cron-secret") ?? "";

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let isCron = false;
    if (cronSecret) {
      const { data: secretRow } = await adminClient.from("site_content")
        .select("value").eq("key", "cron_secret").maybeSingle();
      const expected = (secretRow?.value as any)?.value;
      isCron = !!expected && cronSecret === expected;
    }


    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const supabase = isCron ? adminClient : userClient;

    let callerName = "tester";
    if (!isCron) {
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) return json({ ok: false, error: "Unauthorized" }, 401);
      const { data: roleRow } = await userClient.from("user_roles").select("role")
        .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      if (!roleRow) return json({ ok: false, error: "Forbidden — admin only" }, 403);
      callerName = userData.user.user_metadata?.display_name || userData.user.email || "tester";
    }

    const token = Deno.env.get("DISCORD_BOT_TOKEN");
    if (!token) return json({ ok: false, error: "DISCORD_BOT_TOKEN secret is not configured" });

    const body = await req.json().catch(() => ({}));
    const action: Action = body?.action;
    if (!["announce", "status", "welcome"].includes(action)) {
      return json({ ok: false, error: "Invalid action" }, 400);
    }

    const { data: cfgRow } = await supabase.from("site_content")
      .select("value").eq("key", "discord_bot").maybeSingle();
    const cfg: any = cfgRow?.value ?? {};

    if (action === "announce") {
      const channelId = body.channelId || cfg.announceChannelId;
      const message = body.message || "📢 **Test announcement** from the ZyphoraMC admin panel.";
      if (!channelId) return json({ ok: false, error: "No announcements channel configured" });
      const r = await discordPost(channelId, token, {
        embeds: [{
          title: "Announcement", description: message, color: 0x5865f2,
          footer: { text: "ZyphoraMC · Test" }, timestamp: new Date().toISOString(),
        }],
      });
      return json(r.ok
        ? { ok: true, message: `Announcement sent to channel ${channelId}` }
        : { ok: false, error: `Discord error ${r.status}`, details: r.data });
    }

    if (action === "status") {
      const channelId = body.channelId || cfg.statusChannelId;
      if (!channelId) return json({ ok: false, error: "No status channel configured" });

      const { data: ipRow } = await supabase.from("site_content")
        .select("value").eq("key", "server").maybeSingle();
      const serverIp = (ipRow?.value as any)?.ip ?? "play.zyphoramc.net";

      let mc: any = null;
      try {
        const r = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(serverIp)}`);
        mc = await r.json();
      } catch (_) { mc = null; }

      const embed = buildStatusEmbed(mc, serverIp);
      const existingId: string | undefined = cfg.statusMessageId;
      const sameChannel = cfg.statusMessageChannelId === channelId;

      let result;
      if (existingId && sameChannel) {
        result = await discordPatch(channelId, existingId, token, { embeds: [embed] });
        if (!result.ok && result.status === 404) {
          // Message was deleted — repost
          result = await discordPost(channelId, token, { embeds: [embed] });
          if (result.ok) {
            await adminClient.from("site_content").upsert({
              key: "discord_bot",
              value: { ...cfg, statusMessageId: result.data?.id, statusMessageChannelId: channelId },
            });
          }
        }
      } else {
        result = await discordPost(channelId, token, { embeds: [embed] });
        if (result.ok) {
          await adminClient.from("site_content").upsert({
            key: "discord_bot",
            value: { ...cfg, statusMessageId: result.data?.id, statusMessageChannelId: channelId },
          });
        }
      }

      return json(result.ok
        ? { ok: true, message: `Status ${existingId && sameChannel ? "updated" : "posted"} in channel ${channelId}` }
        : { ok: false, error: `Discord error ${result.status}`, details: result.data });
    }

    if (action === "welcome") {
      const channelId = body.channelId || cfg.welcomeChannelId || cfg.announceChannelId;
      if (!channelId) return json({ ok: false, error: "No welcome channel configured" });
      const template = body.message || cfg.welcomeMessage || "Welcome to ZyphoraMC, {user}!";
      const target = body.username || callerName;
      const rendered = template.replace(/\{user\}/g, `**${target}**`);
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
