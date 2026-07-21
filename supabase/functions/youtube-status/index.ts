import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEFAULT_HANDLE = "WillNorbury";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function pick(re: RegExp, html: string): string | null {
  const m = html.match(re);
  return m ? m[1] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") ?? DEFAULT_HANDLE).replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(handle)) {
      return json({ error: "invalid handle" }, 400);
    }

    const res = await fetch(`https://www.youtube.com/@${handle}/live`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    const html = await res.text();

    const channelId = pick(/"channelId":"(UC[a-zA-Z0-9_-]+)"/, html);
    const videoId = pick(/"videoId":"([a-zA-Z0-9_-]{11})"/, html);
    const isLive = /"isLive":true/.test(html) || /"isLiveBroadcast":\s*"?true/.test(html);
    const title = pick(/"title":"([^"]{1,200})"/, html);
    const author = pick(/"author":"([^"]{1,120})"/, html) ?? handle;
    const viewerRaw = pick(/"concurrentViewers":"(\d+)"/, html);
    const viewerCount = viewerRaw ? parseInt(viewerRaw, 10) : 0;
    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault_live.jpg` : null;

    return json({
      isLive,
      handle,
      channelId,
      videoId: isLive ? videoId : null,
      title: title ? title.replace(/\\u0026/g, "&") : null,
      displayName: author,
      viewerCount,
      thumbnailUrl,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
