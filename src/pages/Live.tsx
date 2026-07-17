import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import TwitchLiveWidget from "@/components/site/TwitchLiveWidget";
import { MessageSquare, Tv } from "lucide-react";

const CHANNEL = "will_norbury";

export default function Live() {
  const [parents, setParents] = useState<string[]>([]);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    document.title = "Live — CarnageMC";
    const hosts = new Set<string>();
    if (typeof window !== "undefined") hosts.add(window.location.hostname);
    // Include known project hosts so the embed works across all domains
    [
      "carnagemc.net",
      "www.carnagemc.net",
      "carnagemc.lovable.app",
      "havocsmp.net",
      "www.havocsmp.net",
      "localhost",
    ].forEach((h) => hosts.add(h));
    setParents(Array.from(hosts));
  }, []);

  const playerSrc = useMemo(() => {
    if (!parents.length) return "";
    const qp = new URLSearchParams();
    qp.set("channel", CHANNEL);
    qp.set("muted", "false");
    qp.set("autoplay", "true");
    const parentPart = parents.map((p) => `parent=${encodeURIComponent(p)}`).join("&");
    return `https://player.twitch.tv/?${qp.toString()}&${parentPart}`;
  }, [parents]);

  const chatSrc = useMemo(() => {
    if (!parents.length) return "";
    const parentPart = parents.map((p) => `parent=${encodeURIComponent(p)}`).join("&");
    return `https://www.twitch.tv/embed/${CHANNEL}/chat?darkpopout&${parentPart}`;
  }, [parents]);

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
              <span className="text-[#9146ff] font-mono text-sm tracking-widest uppercase">
                Twitch · Live
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
              className="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[10px] font-mono tracking-widest uppercase text-[#9ca3af] hover:border-[#9146ff] hover:text-[#c8a2ff] transition self-start"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {showChat ? "Hide chat" : "Show chat"}
            </button>
          </div>

          <TwitchLiveWidget login={CHANNEL} variant="full" />

          <div
            className={
              showChat
                ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"
                : "grid gap-4"
            }
          >
            <div className="relative w-full overflow-hidden border border-white/10 bg-black" style={{ aspectRatio: "16 / 9" }}>
              {playerSrc ? (
                <iframe
                  key={playerSrc}
                  src={playerSrc}
                  title={`${CHANNEL} Twitch stream`}
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

            {showChat && (
              <div className="border border-white/10 bg-black min-h-[420px] lg:min-h-0">
                {chatSrc && (
                  <iframe
                    key={chatSrc}
                    src={chatSrc}
                    title={`${CHANNEL} Twitch chat`}
                    className="h-full min-h-[420px] w-full"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
