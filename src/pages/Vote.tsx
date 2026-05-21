import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, Gift, CheckCircle2, Crown, Sparkles, Coins, Flame, Trophy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const SITES = [
  { id: "mcservers", name: "MinecraftServers.org", url: "https://minecraftservers.org/", reward: "1 Vote Crate Key" },
  { id: "mcmp", name: "MinecraftMP", url: "https://minecraft-mp.com/", reward: "1 Vote Crate Key" },
  { id: "planetmc", name: "PlanetMinecraft", url: "https://www.planetminecraft.com/", reward: "1 Vote Crate Key" },
  { id: "topg", name: "TopG", url: "https://topg.org/minecraft-servers/", reward: "1 Vote Crate Key" },
];

const REWARDS = [
  { icon: Gift, title: "Daily Vote Key", desc: "1 crate key per site, every 24h." },
  { icon: Coins, title: "+250 Coins", desc: "Bonus coins each time you complete all sites in a day." },
  { icon: Sparkles, title: "Streak Multiplier", desc: "7+ day streak doubles your crate rewards." },
  { icon: Crown, title: "Monthly Top Voter", desc: "Win a custom rank, cosmetics, and a hall-of-fame slot." },
];

const STORAGE_KEY = "xylo_votes";

const Vote = () => {
  const { user } = useAuth();
  const [voted, setVoted] = useState<Record<string, number>>({});
  const [streak, setStreak] = useState<{ vote_streak: number; vote_best: number; total_votes: number } | null>(null);

  useEffect(() => {
    document.title = "Vote — XyloMC";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setVoted(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) {
      setStreak(null);
      return;
    }
    supabase
      .from("user_streaks")
      .select("vote_streak, vote_best, total_votes")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setStreak(data ?? { vote_streak: 0, vote_best: 0, total_votes: 0 }));
  }, [user]);

  const isFresh = (ts?: number) => ts && Date.now() - ts < 24 * 60 * 60 * 1000;
  const completed = SITES.filter((s) => isFresh(voted[s.id])).length;
  const progress = (completed / SITES.length) * 100;

  const handleVote = async (id: string, url: string) => {
    const alreadyToday = SITES.some((s) => isFresh(voted[s.id]));
    const next = { ...voted, [id]: Date.now() };
    setVoted(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Vote registered! Run /vote in-game to claim your reward.");

    if (user && !alreadyToday) {
      const { data, error } = await supabase.rpc("record_vote_streak");
      if (!error && data) {
        const row = data as unknown as { vote_streak: number; vote_best: number; total_votes: number };
        setStreak(row);
        if (row.vote_streak > 1) toast(`🔥 ${row.vote_streak}-day vote streak!`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-28 pb-14 overflow-hidden">
          <Particles count={25} />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40"><Gift className="h-3 w-3 mr-1" /> Daily Rewards</Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">Vote for <span className="text-gradient">XyloMC</span></h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Vote daily on each site to earn crate keys, coins, and exclusive rewards. Run <code className="text-foreground font-mono px-1.5 py-0.5 rounded bg-secondary">/vote</code> in-game to claim.
            </p>
          </div>
        </section>

        <div className="container pb-16 space-y-12">
          {/* Progress tracker */}
          <Card className="p-7 border-primary/30 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase tracking-[0.25em] text-primary mb-1">Today's Progress</div>
                <div className="font-display text-2xl font-bold">{completed} / {SITES.length} <span className="text-muted-foreground text-base">sites voted</span></div>
              </div>
              <div className="font-display text-3xl font-black text-gradient">{Math.round(progress)}%</div>
            </div>
            <Progress value={progress} className="h-3" />
            {completed === SITES.length && (
              <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                <CheckCircle2 className="h-4 w-4" />
                All votes complete! Claim your bonus +250 coins in-game.
              </div>
            )}
          </Card>

          {streak && (
            <Card className="p-6 max-w-3xl mx-auto border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-transparent to-primary/5">
              <div className="flex items-center justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-orange-500/15 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.25em] text-orange-400/90">Your Vote Streak</div>
                    <div className="font-display text-2xl font-bold">
                      {streak.vote_streak} <span className="text-muted-foreground text-base font-normal">day{streak.vote_streak === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Trophy className="h-4 w-4 text-amber-400" /> Best <span className="text-foreground font-semibold">{streak.vote_best}</span>
                  </div>
                  <div className="text-muted-foreground">
                    Total <span className="text-foreground font-semibold">{streak.total_votes}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!user && (
            <p className="text-center text-xs text-muted-foreground">
              <a href="/auth" className="text-primary hover:underline">Sign in</a> to start tracking your vote streak.
            </p>
          )}


          {/* Vote sites */}
          <section>
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-[0.3em] text-primary mb-2">Vote Sites</div>
              <h2 className="font-display text-3xl font-bold">Cast Your Daily Votes</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {SITES.map((s) => {
                const done = isFresh(voted[s.id]);
                return (
                  <Card key={s.id} className={`p-5 flex items-center justify-between gap-4 hover-lift hover-glow ${done ? "border-primary/50" : "border-border/60"}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${done ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {done ? <CheckCircle2 className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">Reward: {s.reward}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={done ? "outline" : "default"}
                      className={done ? "" : "glow"}
                      onClick={() => handleVote(s.id, s.url)}
                    >
                      {done ? "Voted" : "Vote"} <ExternalLink className="h-4 w-4 ml-1" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Rewards */}
          <section>
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-[0.3em] text-primary mb-2">What You Earn</div>
              <h2 className="font-display text-3xl font-bold">Vote Rewards</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {REWARDS.map((r) => (
                <Card key={r.title} className="p-5 hover-lift hover-glow text-center">
                  <div className="h-12 w-12 mx-auto rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center mb-3">
                    <r.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold mb-1">{r.title}</h3>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Vote;
