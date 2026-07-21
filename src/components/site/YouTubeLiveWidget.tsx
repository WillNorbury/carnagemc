import { useEffect, useRef, useState } from "react";
import { Loader2, Radio, Users, ArrowUpRight, Youtube } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type YouTubeStatus = {
  isLive: boolean;
  handle: string;
  channelId?: string | null;
  videoId?: string | null;
  title?: string | null;
  displayName?: string;
  viewerCount?: number;
  thumbnailUrl?: string | null;
};

const fmt = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

export default function YouTubeLiveWidget({
  handle = "WillNorbury",
  className,
}: {
  handle?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<YouTubeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = async () => {
    try {
      const url = new URL(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-status`,
      );
      url.searchParams.set("handle", handle);
      const res = await fetch(url.toString(), {
        headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (mounted.current) {
        setStatus(data);
        setError(null);
      }
    } catch (e: any) {
      if (mounted.current) setError(e?.message ?? "Failed to load");
    } finally {
      if (mounted.current) setLoading(false);
    }
  };

  useEffect(() => {
    mounted.current = true;
    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  const channelUrl = `https://www.youtube.com/@${handle}/live`;

  if (loading && !status) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border border-white/10 bg-[#1a1a24] px-3 py-2 text-xs text-[#9ca3af]",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking YouTube…
      </div>
    );
  }

  if (error || !status) {
    return (
      <a
        href={channelUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-2 border border-white/10 bg-[#1a1a24] px-3 py-2 text-xs text-[#9ca3af] hover:text-white",
          className,
        )}
      >
        <Youtube className="h-3.5 w-3.5" /> YouTube
        <ArrowUpRight className="h-3 w-3" />
      </a>
    );
  }

  const live = status.isLive;

  return (
    <div
      className={cn(
        "border p-5 bg-[#1a1a24] flex flex-col gap-4",
        live ? "border-red-500/40" : "border-white/10",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center border border-white/10 bg-black">
          <Youtube className="h-7 w-7 text-red-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest",
                live
                  ? "border-red-500/40 text-red-400 bg-red-500/10"
                  : "border-white/10 text-[#9ca3af]",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  live ? "bg-red-500 animate-pulse" : "bg-[#5f6472]",
                )}
              />
              {live ? "Live" : "Offline"}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-red-400">
              youtube.com/@{status.handle}
            </span>
          </div>
          <div className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-white truncate">
            {status.displayName || status.handle}
          </div>
          {live ? (
            <div className="mt-1 text-sm text-[#e5e7eb] line-clamp-2">
              {status.title || "Streaming now"}
            </div>
          ) : (
            <div className="mt-1 text-sm text-[#9ca3af]">
              Not streaming right now — subscribe for a heads up.
            </div>
          )}
          {live && (status.viewerCount ?? 0) > 0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-red-400">
              <Users className="h-3 w-3" /> {fmt(status.viewerCount!)} watching
            </div>
          )}
        </div>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 border border-red-500/50 bg-red-500/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-red-300 hover:bg-red-500 hover:text-white transition"
        >
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
