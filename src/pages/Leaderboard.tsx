import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Trophy, Vote as VoteIcon, LogIn } from "lucide-react";

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

const Leaderboard = () => {
  const [tab, setTab] = useState<Tab>("login_streak");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Leaderboard — HavocSMP";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("user_streaks")
        .select("user_id,login_streak,login_best,total_logins,vote_streak,vote_best,total_votes")
        .order(tab, { ascending: false })
        .limit(50);
      const list = (data as Row[]) ?? [];
      if (list.length) {
        const ids = list.map((r) => r.user_id);
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,display_name,mc_username,avatar_url")
          .in("id", ids);
        const map = new Map<string, any>();
        (profs ?? []).forEach((p: any) => map.set(p.id, p));
        list.forEach((r) => (r.profile = map.get(r.user_id) ?? null));
      }
      if (!cancelled) {
        setRows(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-10">
          <div className="absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
              <Trophy className="h-3 w-3 mr-1" /> Top Players
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">
              Leader<span className="text-gradient">board</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The most dedicated members on HavocSMP, ranked by login and vote streaks.
            </p>
          </div>
        </section>

        <div className="container pb-20 max-w-4xl">
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.key}
                  size="sm"
                  variant={tab === t.key ? "default" : "outline"}
                  onClick={() => setTab(t.key)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {t.label}
                </Button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">No data yet — be the first!</p>
            </Card>
          ) : (
            <Card className="divide-y divide-border/60 overflow-hidden">
              {rows.map((r, i) => {
                const value = (r as any)[tab] as number;
                const name = r.profile?.display_name || r.profile?.mc_username || "Player";
                const rank = i + 1;
                const medal =
                  rank === 1
                    ? "text-amber-400 border-amber-400/40 bg-amber-400/10"
                    : rank === 2
                    ? "text-slate-300 border-slate-300/40 bg-slate-300/10"
                    : rank === 3
                    ? "text-orange-400 border-orange-400/40 bg-orange-400/10"
                    : "text-muted-foreground border-border";
                return (
                  <Link
                    key={r.user_id}
                    to={`/users`}
                    className="flex items-center gap-4 p-4 hover:bg-accent/40 transition"
                  >
                    <div className={`h-10 w-10 rounded-full border flex items-center justify-center font-display font-bold ${medal}`}>
                      {rank}
                    </div>
                    {r.profile?.avatar_url ? (
                      <img src={r.profile.avatar_url} alt={name} className="h-10 w-10 rounded-full" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted" />
                    )}
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
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
