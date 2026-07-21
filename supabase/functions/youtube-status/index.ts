import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const DEFAULT_HANDLE = "WillNorbury";
// TTLs — live channels refresh faster than offline ones.
const LIVE_TTL_MS = 45_000;
const OFFLINE_TTL_MS = 120_000;
const ERROR_TTL_MS = 30_000;
const STALE_GRACE_MS = 10 * 60_000; // serve stale on upstream failure

type CacheEntry = { data: any; status: number; expiresAt: number; storedAt: number };
const cache = new Map<string, CacheEntry>();
// Coalesce concurrent refreshes for the same handle.
const inflight = new Map<string, Promise<{ data: any; status: number }>>();

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

function pick(re: RegExp, html: string): string | null {
  const m = html.match(re);
  return m ? m[1] : null;
}

async function fetchStatus(handle: string): Promise<{ data: any; status: number }> {
  const res = await fetch(`https://www.youtube.com/@${handle}/live?hl=en&persist_hl=1&gl=US`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      Cookie: "CONSENT=YES+cb; SOCS=CAI; PREF=hl=en&gl=US",
    },
    redirect: "follow",
  });
  const html = await res.text();

  const channelId = pick(/"channelId":"(UC[a-zA-Z0-9_-]+)"/, html);
  const author = pick(/"author":"([^"]{1,120})"/, html) ?? handle;

  const detailsBlock = pick(/"videoDetails":\{([\s\S]{50,6000}?)\},"playerConfig"/, html)
    ?? pick(/"videoDetails":\{([\s\S]{50,6000}?)\}(?=,"annotations"|,"playbackTracking"|,"streamingData")/, html);

  const detailsVideoId = detailsBlock ? pick(/"videoId":"([a-zA-Z0-9_-]{11})"/, detailsBlock) : null;
  const detailsTitle = detailsBlock ? pick(/"title":"([^"]{1,300})"/, detailsBlock) : null;
  const detailsChannelId = detailsBlock ? pick(/"channelId":"(UC[a-zA-Z0-9_-]+)"/, detailsBlock) : null;
  const detailsIsLive = detailsBlock ? /"isLive":true/.test(detailsBlock) : false;

  const belongsToChannel = detailsChannelId && channelId && detailsChannelId === channelId;
  const live = !!(detailsIsLive && detailsVideoId && belongsToChannel);

  if (!live) {
    return {
      status: 200,
      data: {
        isLive: false,
        handle,
        channelId,
        videoId: null,
        title: null,
        displayName: author,
        viewerCount: 0,
        thumbnailUrl: null,
      },
    };
  }

  const viewerRaw =
    pick(new RegExp(`"videoId":"${detailsVideoId}"[\\s\\S]{0,6000}?"concurrentViewers":"(\\d+)"`), html) ??
    pick(/"concurrentViewers":"(\d+)"/, html) ??
    pick(/"originalViewCount":"(\d+)"/, html);
  const viewerCount = viewerRaw ? parseInt(viewerRaw, 10) : 0;

  return {
    status: 200,
    data: {
      isLive: true,
      handle,
      channelId,
      videoId: detailsVideoId,
      title: detailsTitle ? detailsTitle.replace(/\\u0026/g, "&") : null,
      displayName: author,
      viewerCount,
      thumbnailUrl: `https://i.ytimg.com/vi/${detailsVideoId}/hqdefault_live.jpg`,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") ?? DEFAULT_HANDLE).replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9_.-]{2,40}$/.test(handle)) {
      return json({ error: "invalid handle" }, 400);
    }

    // Force a desktop-Chrome UA + full client hints; the Supabase edge IP range
    // otherwise gets bounced to the mobile web (mweb) template which has a very
    // different shape.
    const res = await fetch(`https://www.youtube.com/@${handle}/live?hl=en&persist_hl=1&gl=US`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Ch-Ua": '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        // Skip the EU consent interstitial.
        Cookie: "CONSENT=YES+cb; SOCS=CAI; PREF=hl=en&gl=US",
      },
      redirect: "follow",
    });
    const html = await res.text();

    const channelId = pick(/"channelId":"(UC[a-zA-Z0-9_-]+)"/, html);
    const author = pick(/"author":"([^"]{1,120})"/, html) ?? handle;

    // Isolate the videoDetails block for the primary video on the page and
    // parse the individual fields from it. This avoids assumptions about the
    // ordering of isLive / channelId / etc.
    const detailsBlock = pick(/"videoDetails":\{([\s\S]{50,6000}?)\},"playerConfig"/, html)
      ?? pick(/"videoDetails":\{([\s\S]{50,6000}?)\}(?=,"annotations"|,"playbackTracking"|,"streamingData")/, html);

    const detailsVideoId = detailsBlock ? pick(/"videoId":"([a-zA-Z0-9_-]{11})"/, detailsBlock) : null;
    const detailsTitle = detailsBlock ? pick(/"title":"([^"]{1,300})"/, detailsBlock) : null;
    const detailsChannelId = detailsBlock ? pick(/"channelId":"(UC[a-zA-Z0-9_-]+)"/, detailsBlock) : null;
    const detailsIsLive = detailsBlock ? /"isLive":true/.test(detailsBlock) : false;

    // Require the primary video to (a) be flagged live and (b) belong to the
    // requested channel — this keeps featured live shelves on offline channels
    // from being promoted to the widget.
    const belongsToChannel = detailsChannelId && channelId && detailsChannelId === channelId;
    const live = !!(detailsIsLive && detailsVideoId && belongsToChannel);

    if (!live) {
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

    const viewerRaw =
      pick(new RegExp(`"videoId":"${detailsVideoId}"[\\s\\S]{0,6000}?"concurrentViewers":"(\\d+)"`), html) ??
      pick(/"concurrentViewers":"(\d+)"/, html) ??
      pick(/"originalViewCount":"(\d+)"/, html);
    const viewerCount = viewerRaw ? parseInt(viewerRaw, 10) : 0;

    return json({
      isLive: true,
      handle,
      channelId,
      videoId: detailsVideoId,
      title: detailsTitle ? detailsTitle.replace(/\\u0026/g, "&") : null,
      displayName: author,
      viewerCount,
      thumbnailUrl: `https://i.ytimg.com/vi/${detailsVideoId}/hqdefault_live.jpg`,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
