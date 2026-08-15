import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Vote as VoteIcon,
  Gavel,
  Swords,
  ArrowRight,
  Heart,
  Ticket as TicketIcon,
  User as UserIcon,
} from "lucide-react";

type Order = { id: string; subject: string; status: string; created_at: string };
type Appeal = { id: string; minecraft_username: string; status: string; created_at: string };
type Stats = {
  kills: number;
  deaths: number;
  playtime_seconds: number;
  best_killstreak: number;
  balance: number;
} | null;

const fmtDate = (s: string) => new Date(s).toLocaleDateString();
const hours = (sec: number) => `${Math.round((sec ?? 0) / 3600)}h`;

export default function MeAccount() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; mc_username: string | null } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [votes, setVotes] = useState<{ total: number; streak: number } | null>(null);
  const [stats, setStats] = useState<Stats>(null);
  const [wishlist, setWishlist] = useState(0);
  const [tickets, setTickets] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, o, a, s, w, t] = await Promise.all([
        supabase.from("profiles").select("display_name, mc_username").eq("id", user.id).maybeSingle(),
        supabase
          .from("support_tickets")
          .select("id, subject, status, created_at")
          .eq("user_id", user.id)
          .eq("category", "Store & Payments")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("ban_appeals")
          .select("id, minecraft_username, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase.from("user_streaks").select("total_votes, current_streak").eq("user_id", user.id).maybeSingle(),
        supabase.from("wishlists").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      setProfile((p.data as any) ?? null);
      setOrders((o.data as Order[]) ?? []);
      setAppeals((a.data as Appeal[]) ?? []);
      const sv = s.data as { total_votes?: number; current_streak?: number } | null;
      setVotes(sv ? { total: sv.total_votes ?? 0, streak: sv.current_streak ?? 0 } : null);
      setWishlist(w.count ?? 0);
      setTickets(t.count ?? 0);

      const mc = (p.data as any)?.mc_username;
      if (mc) {
        const { data } = await supabase.rpc("get_player_stats_by_name", { _player_name: mc });
        const row = Array.isArray(data) ? (data[0] as any) : null;
        if (row) setStats(row);
      }
      setLoading(false);
    })();
  }, [user]);

  if (!authLoading && !user) return <Navigate to="/auth" replace />;

  const Tile = ({
    Icon,
    label,
    value,
    to,
  }: {
    Icon: typeof Package;
    label: string;
    value: string | number;
    to: string;
  }) => (
    <Link to={to}>
      <Card className="p-4 h-full hover:border-primary/50 transition">
        <Icon className="h-4 w-4 text-primary mb-2" />
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </Card>
    </Link>
  );

  const Section = ({
    title,
    to,
    linkLabel,
    children,
  }: {
    title: string;
    to: string;
    linkLabel: string;
    children: React.ReactNode;
  }) => (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-bold">{title}</h2>
        <Button asChild variant="ghost" size="sm">
          <Link to={to}>
            {linkLabel} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </div>
      {children}
    </Card>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>My Account — CarnageMC</title>
        <meta name="description" content="Your CarnageMC account: votes, purchases, appeals, tickets and in-game stats in one place." />
        <meta name="robots" content="noindex" />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-primary mb-2">Account</div>
            <h1 className="font-display text-3xl md:text-4xl font-bold">
              {profile?.display_name || user?.email?.split("@")[0] || "My account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {profile?.mc_username ? (
                <>Linked to <span className="font-mono text-foreground">{profile.mc_username}</span></>
              ) : (
                <>
                  No Minecraft account linked —{" "}
                  <Link to="/link-account" className="text-primary hover:underline">link it</Link> to see your stats.
                </>
              )}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/profile">
              <UserIcon className="h-4 w-4 mr-1.5" /> Public profile
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile Icon={VoteIcon} label="Total votes" value={votes?.total ?? 0} to="/vote" />
          <Tile Icon={Package} label="Orders" value={orders.length} to="/me/orders" />
          <Tile Icon={Heart} label="Wishlist" value={wishlist} to="/me/wishlist" />
          <Tile Icon={TicketIcon} label="Tickets" value={tickets} to="/tickets" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Recent orders" to="/me/orders" linkLabel="All orders">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No purchases yet. <Link to="/store" className="text-primary hover:underline">Visit the store</Link>.
              </p>
            ) : (
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{o.subject}</span>
                    <Badge variant="outline" className="shrink-0">{o.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Appeals & punishments" to="/punishments" linkLabel="Punishments">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : appeals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appeals filed.{" "}
                <Link to="/ban-appeals" className="text-primary hover:underline">Submit one</Link> if you've been
                punished.
              </p>
            ) : (
              <ul className="space-y-2">
                {appeals.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">
                      <Gavel className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
                      {a.minecraft_username} · {fmtDate(a.created_at)}
                    </span>
                    <Badge variant="outline" className="shrink-0">{a.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Voting" to="/vote" linkLabel="Vote now">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-display text-3xl font-bold">{votes?.total ?? 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Lifetime votes</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold">{votes?.streak ?? 0}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Day streak</div>
              </div>
            </div>
          </Section>

          <Section title="In-game stats" to="/leaderboard" linkLabel="Leaderboard">
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-display text-2xl font-bold">{stats.kills}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Kills</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{stats.deaths}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Deaths</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{hours(stats.playtime_seconds)}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Playtime</div>
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{stats.best_killstreak}</div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Best streak</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <Swords className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
                {profile?.mc_username
                  ? "No stats recorded yet — jump in game and they'll appear here."
                  : "Link your Minecraft account to track kills, playtime and killstreaks."}
              </p>
            )}
          </Section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
