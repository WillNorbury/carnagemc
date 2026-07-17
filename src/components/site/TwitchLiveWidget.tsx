import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Radio, Users, Gamepad2, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type TwitchStatus = {
  isLive: boolean;
  login: string;
  displayName: string;
  profileImage?: string;
  title?: string | null;
  gameName?: string | null;
  viewerCount?: number;
  startedAt?: string | null;
  thumbnailUrl?: string | null;
};

type Variant = "compact" | "full";

const fmtViewers = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);

const useElapsed = (start: string | null | undefined) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!start) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [start]);
  if (!start) return null;
  const s = Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
};

export default function TwitchLiveWidget({
  login = "will_norbury",
  variant = "compact",
  className,
}: {
  login?: string;
  variant?: Variant;
  className?: string;
}) {
  const [status, setStatus] = useState<TwitchStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("twitch-status", {
        method: "GET",
        body: undefined,
        // pass login via query string
        // @ts-expect-error - runtime accepts a query option in newer supabase-js versions
        query: { login },
      });
      if (error) throw error;
      if (mounted.current) {
        setStatus(data as TwitchStatus);
        setError(null);
      }
    } catch (e: any) {
      // Fallback: call via fetch with query params
      try {
        const url = new URL(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twitch-status`,
        );
        url.searchParams.set("login", login);
        const res = await fetch(url.toString(), {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
        if (mounted.current) {
          setStatus(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted.current) setError(err?.message ?? "Failed to load");
      }
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
  }, [login]);

  const uptime = useElapsed(status?.startedAt);
  const channelUrl = `https://twitch.tv/${status?.login ?? login}`;

  if (loading && !status) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border border-white/10 bg-[#1a1a24] px-3 py-2 text-xs text-[#9ca3af]",
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking Twitch…
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
        <Radio className="h-3.5 w-3.5" /> Twitch
        <ArrowUpRight className="h-3 w-3" />
      </a>
    );
  }

  const live = status.isLive;

  if (variant === "compact") {
    return (
      <Link
        to="/live"
        className={cn(
          "group inline-flex items-center gap-3 border px-3 py-2 bg-[#1a1a24] transition min-w-0",
          live
            ? "border-[#9146ff]/50 hover:border-[#9146ff]"
            : "border-white/10 hover:border-white/20",
          className,
        )}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {live && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
          )}
          <span
            className={cn(
              "relative inline-flex h-2.5 w-2.5 rounded-full",
              live ? "bg-red-500" : "bg-[#5f6472]",
            )}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest">
            <span className={live ? "text-red-400" : "text-[#9ca3af]"}>
              {live ? "Live now" : "Offline"}
            </span>
            <span className="text-[#5f6472]">·</span>
            <span className="text-[#9146ff]">Twitch</span>
          </span>
          <span className="block truncate text-sm font-semibold text-white">
            {status.displayName}
          </span>
          {live && status.title && (
            <span className="block truncate text-xs text-[#9ca3af]">{status.title}</span>
          )}
        </span>
        {live && (
          <span className="hidden sm:flex flex-col items-end text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
            <span className="flex items-center gap-1 text-red-400">
              <Users className="h-3 w-3" /> {fmtViewers(status.viewerCount ?? 0)}
            </span>
            {uptime && <span>{uptime}</span>}
          </span>
        )}
        <ArrowUpRight className="h-4 w-4 shrink-0 text-[#9ca3af] group-hover:text-white transition" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "border p-5 bg-[#1a1a24] flex flex-col gap-4",
        live ? "border-[#9146ff]/40" : "border-white/10",
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {status.profileImage && (
          <img
            src={status.profileImage}
            alt={status.displayName}
            loading="lazy"
            className="h-14 w-14 rounded-full border border-white/10 object-cover"
          />
        )}
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#9146ff]">
              twitch.tv/{status.login}
            </span>
          </div>
          <div className="mt-1 font-['Space_Grotesk'] text-xl font-bold text-white">
            {status.displayName}
          </div>
          {live ? (
            <div className="mt-1 text-sm text-[#e5e7eb] line-clamp-2">
              {status.title || "Streaming now"}
            </div>
          ) : (
            <div className="mt-1 text-sm text-[#9ca3af]">
              Not streaming right now — follow for a heads up.
            </div>
          )}
        </div>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 border border-[#9146ff]/50 bg-[#9146ff]/10 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-[#c8a2ff] hover:bg-[#9146ff] hover:text-white transition"
        >
          Open <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>

      {live && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Stat icon={<Users className="h-3.5 w-3.5 text-red-400" />} label="Viewers" value={fmtViewers(status.viewerCount ?? 0)} />
          <Stat icon={<Gamepad2 className="h-3.5 w-3.5 text-[#9146ff]" />} label="Game" value={status.gameName ?? "—"} />
          <Stat icon={<Radio className="h-3.5 w-3.5 text-[#ff5722]" />} label="Uptime" value={uptime ?? "—"} />
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="border border-white/5 bg-[#0a0a0f] p-2.5 min-w-0">
      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 truncate font-['Space_Grotesk'] text-base font-bold text-white">
        {value}
      </div>
    </div>
  );
}
