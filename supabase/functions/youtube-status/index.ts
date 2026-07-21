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

    const res = await fetch(`https://www.youtube.com/@${handle}/live?hl=en&persist_hl=1&gl=US`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        // Skip the EU consent interstitial that otherwise strips useful HTML.
        Cookie: "CONSENT=YES+cb; SOCS=CAI",
      },
      redirect: "follow",
    });
    const html = await res.text();

    const channelId = pick(/"channelId":"(UC[a-zA-Z0-9_-]+)"/, html);
    const author = pick(/"author":"([^"]{1,120})"/, html) ?? handle;

    // YouTube serves the /@handle/live page with a canonical link pointing at the
    // active live watch URL only when that channel is actually live right now.
    // Combined with a liveBroadcastDetails.isLiveNow:true marker, this reliably
    // separates a real live stream from featured/recommended content on the page.
    const canonical = pick(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/, html);
    const liveNow = /"liveBroadcastDetails":\{"isLiveNow":true/.test(html);

    if (!canonical || !liveNow) {
      return json({
        isLive: false,
        handle,
        channelId,
        videoId: null,
        title: null,
        displayName: author,
        viewerCount: 0,
        thumbnailUrl: null,
      });
    }

    // Scope title/viewer regexes to the block belonging to THIS live video to
    // avoid pulling data from unrelated shelf entries in the same HTML payload.
    const videoBlockRe = new RegExp(
      `"videoId":"${canonical}"[\\s\\S]{0,6000}?"title":\\{"runs":\\[\\{"text":"([^"]{1,200})"`,
    );
    const title =
      pick(videoBlockRe, html) ??
      pick(/"videoPrimaryInfoRenderer"[\s\S]{0,1500}?"title":\{"runs":\[\{"text":"([^"]{1,200})"/, html) ??
      pick(/<meta name="title" content="([^"]{1,200})"/, html);
    const viewerRaw =
      pick(new RegExp(`"videoId":"${canonical}"[\\s\\S]{0,6000}?"concurrentViewers":"(\\d+)"`), html) ??
      pick(/"concurrentViewers":"(\d+)"/, html);
    const viewerCount = viewerRaw ? parseInt(viewerRaw, 10) : 0;

    return json({
      isLive: true,
      handle,
      channelId,
      videoId: canonical,
      title: title ? title.replace(/\\u0026/g, "&") : null,
      displayName: author,
      viewerCount,
      thumbnailUrl: `https://i.ytimg.com/vi/${canonical}/hqdefault_live.jpg`,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
