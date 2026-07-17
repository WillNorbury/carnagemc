import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twitch";
const DEFAULT_LOGIN = "will_norbury";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function twitchGet(path: string, params: Record<string, string>) {
  const url = new URL(`${GATEWAY_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "X-Connection-Api-Key": Deno.env.get("TWITCH_API_KEY") ?? "",
    },
  });
  const body = await res.text();
  if (!res.ok) {
    console.error(`Twitch ${path} failed [${res.status}]: ${body}`);
    throw new Error(`Twitch API ${path} ${res.status}: ${body}`);
  }
  return JSON.parse(body);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!Deno.env.get("LOVABLE_API_KEY") || !Deno.env.get("TWITCH_API_KEY")) {
      return json({ error: "Twitch connector not configured" }, 500);
    }

    const url = new URL(req.url);
    const rawLogin = (url.searchParams.get("login") ?? DEFAULT_LOGIN).trim().toLowerCase();
    if (!/^[a-z0-9_]{2,32}$/.test(rawLogin)) {
      return json({ error: "invalid login" }, 400);
    }

    const [usersRes, streamsRes] = await Promise.all([
      twitchGet("/users", { login: rawLogin }),
      twitchGet("/streams", { user_login: rawLogin }),
    ]);

    const user = usersRes?.data?.[0];
    const stream = streamsRes?.data?.[0];
    if (!user) {
      return json({ isLive: false, login: rawLogin, error: "channel not found" }, 404);
    }

    let gameName: string | null = stream?.game_name ?? null;
    if (stream?.game_id && !gameName) {
      try {
        const g = await twitchGet("/games", { id: stream.game_id });
        gameName = g?.data?.[0]?.name ?? null;
      } catch { /* ignore */ }
    }

    return json({
      isLive: !!stream,
      login: user.login,
      displayName: user.display_name,
      profileImage: user.profile_image_url,
      description: user.description ?? "",
      title: stream?.title ?? null,
      gameName,
      viewerCount: stream?.viewer_count ?? 0,
      startedAt: stream?.started_at ?? null,
      thumbnailUrl: stream?.thumbnail_url ?? null,
      language: stream?.language ?? null,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
