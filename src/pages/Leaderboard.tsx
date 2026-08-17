import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame, Trophy, Vote as VoteIcon, LogIn, Crown,
  Swords, Skull, Crosshair, Clock, Coins, Bug, Target,
} from "lucide-react";
import { GlassCard, PageHero, Reveal, AnimatedCounter } from "@/components/site/ui-kit";
import { cn } from "@/lib/utils";

type Row = {
  user_id: string;
  login_streak: number;
  login_best: number;
  total_logins: number;
  vote_streak: number;
  vote_best: number;
  total_votes: number;
  profile?: { display_name: string | null; mc_username: string | null; avatar_url: string | null } | null;
};

type StatRow = {
  player_name: string;
  kills: number;
  deaths: number;
  killstreak: number;
  best_killstreak: number;
  playtime_seconds: number;
  balance: number;
  mob_kills: number;
  kdr: number;
};

type Tab = "login_streak" | "login_best" | "vote_streak" | "vote_best" | "total_votes";
type StatTab =
  | "kills" | "deaths" | "kdr" | "killstreak"
  | "best_killstreak" | "playtime" | "balance" | "mob_kills";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "login_streak", label: "Login Streak", icon: Flame },
  { key: "login_best", label: "Best Login", icon: Trophy },
  { key: "vote_streak", label: "Vote Streak", icon: VoteIcon },
  { key: "vote_best", label: "Best Vote", icon: Trophy },
  { key: "total_votes", label: "Total Votes", icon: LogIn },
];

const STAT_TABS: { key: StatTab; label: string; icon: any }[] = [
  { key: "kills", label: "Kills", icon: Swords },
  { key: "deaths", label: "Deaths", icon: Skull },
  { key: "kdr", label: "KDR", icon: Target },
  { key: "killstreak", label: "Killstreak", icon: Crosshair },
  { key: "best_killstreak", label: "Best Streak", icon: Trophy },
  { key: "playtime", label: "Playtime", icon: Clock },
  { key: "balance", label: "Balance", icon: Coins },
  { key: "mob_kills", label: "Mob Kills", icon: Bug },
];

const medalStyles = [
  "text-amber-400 border-amber-400/50 bg-amber-400/10",
  "text-slate-300 border-slate-300/50 bg-slate-300/10",
  "text-orange-400 border-orange-400/50 bg-orange-400/10",
];

const PlayerAvatar = ({ row, size }: { row: Row; size: number }) => {
  const name = row.profile?.display_name || row.profile?.mc_username || "Player";
  const src = row.profile?.mc_username
    ? `https://mc-heads.net/avatar/${row.profile.mc_username}/${size * 2}`
    : row.profile?.avatar_url ?? undefined;
  return src ? (
    <img
      src={src}
      alt={name}
      loading="lazy"
      style={{ width: size, height: size }}
      className="rounded-full object-cover ring-2 ring-primary/30"
    />
  ) : (
    <div style={{ width: size, height: size }} className="rounded-full bg-muted" />
  );
};

const StatAvatar = ({ name, size }: { name: string; size: number }) => (
  <img
    src={`https://mc-heads.net/avatar/${name}/${size * 2}`}
    alt={name}
    loading="lazy"
    style={{ width: size, height: size }}
    className="rounded-full object-cover ring-2 ring-primary/30"
  />
);

function formatStat(tab: StatTab, r: StatRow): number {
  const v = (r as any)[tab] as number;
  return typeof v === "number" ? v : 0;
}

function formatStatLabel(tab: StatTab, v: number): string {
  if (tab === "playtime") {
    const h = Math.floor(v / 3600);
    if (h >= 1) return `${h}h`;
    const m = Math.floor(v / 60);
    return `${m}m`;
  }
  if (tab === "balance") return `$${v.toLocaleString()}`;
  if (tab === "kdr") return v.toFixed(2);
  return v.toLocaleString();
}

const Leaderboard = () => {
  const [tab, setTab] = useState<Tab | StatTab>("login_streak");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [statRows, setStatRows] = useState<StatRow[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    document.title = "Leaderboard — CarnageMC";
  }, []);

  const isStreak = (TABS.some((t) => t.key === tab));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (isStreak) {
      (async () => {
        const { data } = await supabase.rpc("get_streak_leaderboard", { _metric: tab, _limit: 50 });
        const raw = (data as any[]) ?? [];
        const list: Row[] = raw.map((r) => ({
          user_id: r.user_id,
          login_streak: r.login_streak,
          login_best: r.login_best,
          total_logins: r.total_logins,
          vote_streak: r.vote_streak,
          vote_best: r.vote_best,
          total_votes: r.total_votes,
          profile: {
            display_name: r.display_name,
            mc_username: r.mc_username,
            avatar_url: r.avatar_url,
          },
        }));
        if (!cancelled) { setRows(list); setStatRows([]); setLoading(false); }
      })();
    } else {
      (async () => {
        const { data } = await (supabase as any).rpc("get_stats_leaderboard", { _metric: tab, _limit: 50 });
        const list: StatRow[] = ((data as any[]) ?? []).map((r) => ({
          player_name: r.player_name,
          kills: r.kills,
          deaths: r.deaths,
          killstreak: r.killstreak,
          best_killstreak: r.best_killstreak,
          playtime_seconds: r.playtime_seconds,
          balance: r.balance,
          mob_kills: r.mob_kills,
          kdr: Number(r.kdr) || 0,
        }));
        if (!cancelled) { setStatRows(list); setRows([]); setLoading(false); }
      })();
    }
    return () => { cancelled = true; };
  }, [tab]);

  const allTabs = [...TABS, ...STAT_TABS];
  const order = [1, 0, 2];

  // Determine whether streak or stat mode
  const isStreakMode = TABS.some((t) => t.key === tab);

  const needle = query.trim().toLowerCase();
  const fRows = needle
    ? rows.filter((r) =>
        `${r.profile?.display_name ?? ""} ${r.profile?.mc_username ?? ""}`.toLowerCase().includes(needle),
      )
    : rows;
  const fStatRows = needle
    ? statRows.filter((r) => (r.player_name ?? "").toLowerCase().includes(needle))
    : statRows;


  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHero
          eyebrow={<><Trophy className="h-3 w-3 mr-1" /> Top Players</>}
          title="Leader"
          highlight="board"
          description="The most dedicated members on CarnageMC — ranked by streaks and gameplay stats."
        />

        <div className="container pb-24 max-w-4xl">
          <div
            role="tablist"
            aria-label="Leaderboard metric"
            className="flex flex-wrap gap-2 justify-center mb-6"
          >
            {allTabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <Button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  size="sm"
                  variant={active ? "premium" : "glass"}
                  onClick={() => setTab(t.key)}
                  className="rounded-full"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {t.label}
                </Button>
              );
            })}
          </div>

          <div className="relative mx-auto mb-10 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search players…"
              aria-label="Search players on the leaderboard"
              className="rounded-full pl-9"
            />
          </div>


          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 rounded-2xl" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : isStreakMode ? (
            fRows.length === 0 ? (
              <GlassCard className="p-12 text-center">
                <p className="text-muted-foreground">No data yet — be the first!</p>
              </GlassCard>
            ) : (
              <div className="space-y-10">
                <div className="grid grid-cols-3 gap-3 sm:gap-5 items-end">
                  {order.map((idx) => {
                    const r = fRows[idx];
                    if (!r) return <div key={idx} />;
                    const name = r.profile?.display_name || r.profile?.mc_username || "Player";
                    const value = (r as any)[tab] as number;
                    const heights = ["h-36 sm:h-44", "h-28 sm:h-32", "h-24 sm:h-28"];
                    return (
                      <Reveal key={r.user_id} delay={idx * 90}>
                        <GlassCard
                          glow={idx === 0}
                          className={cn("flex flex-col items-center justify-end p-4 text-center", heights[idx])}
                        >
                          <div className="-mt-12 mb-2 relative">
                            {idx === 0 && (
                              <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-400" />
                            )}
                            <PlayerAvatar row={r} size={idx === 0 ? 64 : 48} />
                          </div>
                          <div className={cn("mb-1 h-7 w-7 rounded-full border flex items-center justify-center font-display text-xs font-bold", medalStyles[idx])}>
                            {idx + 1}
                          </div>
                          <div className="text-sm font-semibold truncate max-w-full">{name}</div>
                          <div className="font-display text-xl font-black text-gradient">
                            <AnimatedCounter to={value ?? 0} />
                          </div>
                        </GlassCard>
                      </Reveal>
                    );
                  })}
                </div>

                {fRows.slice(3).length > 0 && (
                  <GlassCard className="divide-y divide-border/50 overflow-hidden">
                    {fRows.slice(3).map((r, i) => {
                      const value = (r as any)[tab] as number;
                      const name = r.profile?.display_name || r.profile?.mc_username || "Player";
                      const rank = i + 4;
                      return (
                        <Link key={r.user_id} to="/users" className="flex items-center gap-4 p-4 transition-colors hover:bg-primary/5">
                          <div className="h-9 w-9 rounded-full border border-border flex items-center justify-center font-display text-sm font-bold text-muted-foreground">
                            {rank}
                          </div>
                          <PlayerAvatar row={r} size={40} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{name}</div>
                            {r.profile?.mc_username && (
                              <div className="text-xs text-muted-foreground truncate">{r.profile.mc_username}</div>
                            )}
                          </div>
                          <div className="font-display font-bold text-xl text-primary">{value}</div>
                        </Link>
                      );
                    })}
                  </GlassCard>
                )}
              </div>
            )
          ) : fStatRows.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <p className="text-muted-foreground">No gameplay stats yet. Stats appear once the server bridge starts reporting.</p>
            </GlassCard>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-3 gap-3 sm:gap-5 items-end">
                {order.map((idx) => {
                  const r = fStatRows[idx];
                  if (!r) return <div key={idx} />;
                  const name = r.player_name || "Player";
                  const value = formatStat(tab as StatTab, r);
                  const heights = ["h-36 sm:h-44", "h-28 sm:h-32", "h-24 sm:h-28"];
                  return (
                    <Reveal key={r.player_name + idx} delay={idx * 90}>
                      <GlassCard
                        glow={idx === 0}
                        className={cn("flex flex-col items-center justify-end p-4 text-center", heights[idx])}
                      >
                        <div className="-mt-12 mb-2 relative">
                          {idx === 0 && (
                            <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-400" />
                          )}
                          <StatAvatar name={name} size={idx === 0 ? 64 : 48} />
                        </div>
                        <div className={cn("mb-1 h-7 w-7 rounded-full border flex items-center justify-center font-display text-xs font-bold", medalStyles[idx])}>
                          {idx + 1}
                        </div>
                        <div className="text-sm font-semibold truncate max-w-full">{name}</div>
                        <div className="font-display text-xl font-black text-gradient">
                          {formatStatLabel(tab as StatTab, value)}
                        </div>
                      </GlassCard>
                    </Reveal>
                  );
                })}
              </div>

              {fStatRows.slice(3).length > 0 && (
                <GlassCard className="divide-y divide-border/50 overflow-hidden">
                  {fStatRows.slice(3).map((r, i) => {
                    const value = formatStat(tab as StatTab, r);
                    const name = r.player_name || "Player";
                    const rank = i + 4;
                    return (
                      <div key={r.player_name + i} className="flex items-center gap-4 p-4 transition-colors hover:bg-primary/5">
                        <div className="h-9 w-9 rounded-full border border-border flex items-center justify-center font-display text-sm font-bold text-muted-foreground">
                          {rank}
                        </div>
                        <StatAvatar name={name} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {r.kills} kills · {r.deaths} deaths · KDR {Number(r.kdr).toFixed(2)}
                          </div>
                        </div>
                        <div className="font-display font-bold text-xl text-primary">
                          {formatStatLabel(tab as StatTab, value)}
                        </div>
                      </div>
                    );
                  })}
                </GlassCard>
              )}
            </div>
          )}

          {!loading && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              Showing top {(isStreakMode ? fRows : fStatRows).length} players ·{" "}
              <Badge variant="secondary" className="border-primary/30 align-middle">
                {allTabs.find((t) => t.key === tab)?.label}
              </Badge>
            </p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
