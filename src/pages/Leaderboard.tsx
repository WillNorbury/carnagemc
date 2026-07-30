import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Trophy, Vote as VoteIcon, LogIn, Crown } from "lucide-react";
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

type Tab = "login_streak" | "login_best" | "vote_streak" | "vote_best" | "total_votes";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "login_streak", label: "Login Streak", icon: Flame },
  { key: "login_best", label: "Best Login", icon: Trophy },
  { key: "vote_streak", label: "Vote Streak", icon: VoteIcon },
  { key: "vote_best", label: "Best Vote", icon: Trophy },
  { key: "total_votes", label: "Total Votes", icon: LogIn },
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

const Leaderboard = () => {
  const [tab, setTab] = useState<Tab>("login_streak");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Leaderboard — CarnageMC";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
      if (!cancelled) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const order = [1, 0, 2]; // silver, gold, bronze visual order

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHero
          eyebrow={<><Trophy className="h-3 w-3 mr-1" /> Top Players</>}
          title="Leader"
          highlight="board"
          description="The most dedicated members on CarnageMC, ranked by login and vote streaks."
        />

        <div className="container pb-24 max-w-4xl">
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.key}
                  size="sm"
                  variant={tab === t.key ? "premium" : "glass"}
                  onClick={() => setTab(t.key)}
                  className="rounded-full"
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {t.label}
                </Button>
              );
            })}
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-48 rounded-2xl" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <p className="text-muted-foreground">No data yet — be the first!</p>
            </GlassCard>
          ) : (
            <div className="space-y-10">
              {/* Podium */}
              <div className="grid grid-cols-3 gap-3 sm:gap-5 items-end">
                {order.map((idx) => {
                  const r = podium[idx];
                  if (!r) return <div key={idx} />;
                  const name = r.profile?.display_name || r.profile?.mc_username || "Player";
                  const value = (r as any)[tab] as number;
                  const heights = ["h-36 sm:h-44", "h-28 sm:h-32", "h-24 sm:h-28"];
                  return (
                    <Reveal key={r.user_id} delay={idx * 90}>
                      <GlassCard
                        glow={idx === 0}
                        className={cn(
                          "flex flex-col items-center justify-end p-4 text-center",
                          heights[idx],
                        )}
                      >
                        <div className="-mt-12 mb-2 relative">
                          {idx === 0 && (
                            <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-400" />
                          )}
                          <PlayerAvatar row={r} size={idx === 0 ? 64 : 48} />
                        </div>
                        <div
                          className={cn(
                            "mb-1 h-7 w-7 rounded-full border flex items-center justify-center font-display text-xs font-bold",
                            medalStyles[idx],
                          )}
                        >
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

              {/* Rest */}
              {rest.length > 0 && (
                <GlassCard className="divide-y divide-border/50 overflow-hidden">
                  {rest.map((r, i) => {
                    const value = (r as any)[tab] as number;
                    const name = r.profile?.display_name || r.profile?.mc_username || "Player";
                    const rank = i + 4;
                    return (
                      <Link
                        key={r.user_id}
                        to="/users"
                        className="flex items-center gap-4 p-4 transition-colors hover:bg-primary/5"
                      >
                        <div className="h-9 w-9 rounded-full border border-border flex items-center justify-center font-display text-sm font-bold text-muted-foreground">
                          {rank}
                        </div>
                        <PlayerAvatar row={r} size={40} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{name}</div>
                          {r.profile?.mc_username && (
                            <div className="text-xs text-muted-foreground truncate">
                              {r.profile.mc_username}
                            </div>
                          )}
                        </div>
                        <div className="font-display font-bold text-xl text-primary">{value}</div>
                      </Link>
                    );
                  })}
                </GlassCard>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Showing top {rows.length} players ·{" "}
                <Badge variant="secondary" className="border-primary/30 align-middle">
                  {TABS.find((t) => t.key === tab)?.label}
                </Badge>
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
