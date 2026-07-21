import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import TwitchLiveWidget from "@/components/site/TwitchLiveWidget";
import TwitchClipsGallery from "@/components/site/TwitchClipsGallery";
import YouTubeLiveWidget, { type YouTubeStatus } from "@/components/site/YouTubeLiveWidget";
import { MessageSquare, Tv, Youtube as YoutubeIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TWITCH_CHANNEL = "will_norbury";
const YT_HANDLE = "WillNorbury";
const YT_CHANNEL_ID = "UClypnnDmHLVaSMyPNLzxwmQ";

type Platform = "twitch" | "youtube";

export default function Live() {
  const [searchParams, setSearchParams] = useSearchParams();
  const platform: Platform = searchParams.get("youtube") !== null
    ? "youtube"
    : searchParams.get("twitch") !== null
      ? "twitch"
      : "twitch";

  const [parents, setParents] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    document.title = platform === "youtube" ? "YouTube Live — CarnageMC" : "Twitch Live — CarnageMC";
    const hosts = new Set<string>();
    if (typeof window !== "undefined") hosts.add(window.location.hostname);
    [
      "carnagemc.net",
      "www.carnagemc.net",
      "carnagemc.lovable.app",
      "havocsmp.net",
      "www.havocsmp.net",
      "localhost",
    ].forEach((h) => hosts.add(h));
    setParents(Array.from(hosts));
  }, [platform]);

  const switchTo = (p: Platform) => {
    const next = new URLSearchParams(searchParams);
    next.delete("twitch");
    next.delete("youtube");
    next.set(p, "");
    setSearchParams(next, { replace: true });
  };

  const twitchPlayerSrc = useMemo(() => {
    if (!parents.length) return "";
    const qp = new URLSearchParams();
    qp.set("channel", TWITCH_CHANNEL);
    qp.set("muted", "false");
    qp.set("autoplay", "true");
    const parentPart = parents.map((p) => `parent=${encodeURIComponent(p)}`).join("&");
    return `https://player.twitch.tv/?${qp.toString()}&${parentPart}`;
  }, [parents]);

  const twitchChatSrc = useMemo(() => {
    if (!parents.length) return "";
    const parentPart = parents.map((p) => `parent=${encodeURIComponent(p)}`).join("&");
    return `https://www.twitch.tv/embed/${TWITCH_CHANNEL}/chat?darkpopout&${parentPart}`;
  }, [parents]);

  // YouTube live_stream embed picks up the channel's current live broadcast or shows an offline card.
  const ytPlayerSrc = `https://www.youtube.com/embed/live_stream?channel=UClypnnDmHLVaSMyPNLzxwmQ&autoplay=1`;
  const ytChatSrc = `https://www.youtube.com/live_chat?v=&embed_domain=${typeof window !== "undefined" ? window.location.hostname : "carnagemc.net"}`;

  const isYT = platform === "youtube";

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-slate-100">
      <link
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap"
        rel="stylesheet"
      />
      <Navbar />
      <main className="flex-1 w-full font-['Inter']">
        <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/5 pb-6">
            <div className="min-w-0">
              <span className={cn("font-mono text-sm tracking-widest uppercase", isYT ? "text-red-500" : "text-[#9146ff]")}>
                {isYT ? "YouTube · Live" : "Twitch · Live"}
              </span>
              <h1 className="text-5xl md:text-7xl font-bold font-['Space_Grotesk'] tracking-tighter italic break-words">
                LIVE
              </h1>
              <p className="text-[#9ca3af] max-w-xl mt-1">
                Watch the stream without leaving the site. Status updates every minute.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowChat((v) => !v)}
              className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-mono tracking-widest uppercase text-[#9ca3af] hover:border-white/30 hover:text-white transition self-start"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {showChat ? "Hide chat" : "Show chat"}
            </button>
          </div>

          {/* Platform tabs */}
          <div className="inline-flex border border-white/10 bg-[#1a1a24] w-fit">
            <button
              type="button"
              onClick={() => switchTo("twitch")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-[11px] font-mono uppercase tracking-widest transition",
                !isYT
                  ? "bg-[#9146ff]/20 text-white border-r border-[#9146ff]/40"
                  : "text-[#9ca3af] hover:text-white border-r border-white/10",
              )}
            >
              <Tv className="h-3.5 w-3.5" /> Twitch
            </button>
            <button
              type="button"
              onClick={() => switchTo("youtube")}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 text-[11px] font-mono uppercase tracking-widest transition",
                isYT
                  ? "bg-red-500/20 text-white"
                  : "text-[#9ca3af] hover:text-white",
              )}
            >
              <YoutubeIcon className="h-3.5 w-3.5" /> YouTube
            </button>
          </div>

          {isYT ? (
            <YouTubeLiveWidget handle={YT_HANDLE} />
          ) : (
            <TwitchLiveWidget login={TWITCH_CHANNEL} variant="full" />
          )}

          <div
            className={
              showChat && !isYT
                ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"
                : "grid gap-4"
            }
          >
            <div className="relative w-full overflow-hidden border border-white/10 bg-black" style={{ aspectRatio: "16 / 9" }}>
              {isYT ? (
                <iframe
                  key={ytPlayerSrc}
                  src={ytPlayerSrc}
                  title={`${YT_HANDLE} YouTube stream`}
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  className="absolute inset-0 h-full w-full"
                />
              ) : twitchPlayerSrc ? (
                <iframe
                  key={twitchPlayerSrc}
                  src={twitchPlayerSrc}
                  title={`${TWITCH_CHANNEL} Twitch stream`}
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                  className="absolute inset-0 h-full w-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-[#9ca3af]">
                  <Tv className="h-6 w-6 mr-2" /> Loading player…
                </div>
              )}
            </div>

            {showChat && !isYT && (
              <div className="border border-white/10 bg-black min-h-[420px] lg:min-h-0">
                {twitchChatSrc && (
                  <iframe
                    key={twitchChatSrc}
                    src={twitchChatSrc}
                    title={`${TWITCH_CHANNEL} Twitch chat`}
                    className="h-full min-h-[420px] w-full"
                  />
                )}
              </div>
            )}
          </div>

          {!isYT && <TwitchClipsGallery login={TWITCH_CHANNEL} parents={parents} />}
        </div>

      </main>
      <Footer />
    </div>
  );
}
