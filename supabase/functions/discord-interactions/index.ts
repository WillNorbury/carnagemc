// Discord Interactions endpoint — handles slash commands.
// Configure this URL as the "Interactions Endpoint URL" in your Discord app:
//   https://<project-ref>.functions.supabase.co/discord-interactions
import nacl from "https://esm.sh/tweetnacl@1.0.3";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY") ?? "";

const InteractionType = { PING: 1, APPLICATION_COMMAND: 2 };
const InteractionResponseType = { PONG: 1, CHANNEL_MESSAGE_WITH_SOURCE: 4 };

function hexToBytes(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function verify(req: Request, rawBody: string) {
  const sig = req.headers.get("x-signature-ed25519");
  const ts = req.headers.get("x-signature-timestamp");
  if (!sig || !ts || !PUBLIC_KEY) return false;
  try {
    return nacl.sign.detached.verify(
      new TextEncoder().encode(ts + rawBody),
      hexToBytes(sig),
      hexToBytes(PUBLIC_KEY),
    );
  } catch {
    return false;
  }
}

async function buildRulesEmbed() {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: rows } = await supabase
    .from("rule_sections")
    .select("title, items, sort_order")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const fields = (rows ?? []).map((s: any, idx: number) => ({
    name: `${idx + 1}. ${s.title}`,
    value: (s.items ?? []).map((it: string) => `• ${it}`).join("\n") || "—",
  }));

  return {
    title: "📜 CarnageMC Rules",
    description: "Please read and follow these rules.",
    color: 0xef4444,
    fields: fields.length > 0 ? fields : [{ name: "No rules", value: "No rules configured." }],
    footer: { text: "CarnageMC · Updated regularly" },
    timestamp: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  if (!(await verify(req, raw))) return new Response("invalid request signature", { status: 401 });

  const body = JSON.parse(raw);
  if (body.type === InteractionType.PING) {
    return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (body.type === InteractionType.APPLICATION_COMMAND) {
    const name = body.data?.name;
    if (name === "rules") {
      const embed = await buildRulesEmbed();
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { embeds: [embed] },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (name === "subscribe" || name === "unsubscribe") {
      const subscribed = name === "subscribe";
      const discordId = body.member?.user?.id ?? body.user?.id;
      const reply = (content: string) => new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content, flags: 64 },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
      if (!discordId) return reply("Could not determine your Discord account.");

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: link } = await supabase
        .from("profiles_private")
        .select("user_id")
        .eq("discord_id", discordId)
        .maybeSingle();
      const { data: profile } = link
        ? await supabase
            .from("profiles")
            .select("id, preferences")
            .eq("id", link.user_id)
            .maybeSingle()
        : { data: null as any };

      if (!profile) {
        return reply("⚠️ Your Discord account isn't linked to a CarnageMC account yet. Sign in on the website and link Discord first.");
      }

      const prefs = { ...(profile.preferences ?? {}), email_subscribed: subscribed };
      const { error } = await supabase
        .from("profiles")
        .update({ preferences: prefs })
        .eq("id", profile.id);

      if (error) return reply(`❌ Failed to update: ${error.message}`);
      return reply(subscribed
        ? "✅ You're subscribed to email notifications from CarnageMC."
        : "✅ You've been unsubscribed from email notifications.");
    }
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: "Unknown command", flags: 64 },
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response("ok");
});
