import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";
import { Loader2, ShieldCheck, ShieldAlert, Mail, MailCheck, User as UserIcon, Flame, LogIn, Vote as VoteIcon, ExternalLink, KeyRound } from "lucide-react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Profile = {
  display_name: string | null;
  mc_username: string | null;
  avatar_url: string | null;
  created_at?: string | null;
};

type PrivateProfile = {
  discord_username: string | null;
  discord_id: string | null;
};

type Streaks = {
  login_streak: number;
  login_best: number;
  total_logins: number;
  vote_streak: number;
  vote_best: number;
  total_votes: number;
  last_login_date: string | null;
  last_vote_date: string | null;
};

export default function MeStatus() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [priv, setPriv] = useState<PrivateProfile | null>(null);
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [p, pp, s, r, factors] = await Promise.all([
        supabase.from("profiles").select("display_name, mc_username, avatar_url, created_at").eq("id", user.id).maybeSingle(),
        supabase.from("profiles_private").select("discord_username, discord_id").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_streaks").select("login_streak, login_best, total_logins, vote_streak, vote_best, total_votes, last_login_date, last_vote_date").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.auth.mfa.listFactors(),
      ]);
      if (cancelled) return;
      setProfile((p.data as Profile) ?? null);
      setPriv((pp.data as PrivateProfile) ?? null);
      setStreaks((s.data as Streaks) ?? null);
      setRoles(((r.data ?? []) as { role: string }[]).map((x) => x.role));
      setMfaEnabled(!!factors.data?.totp?.some((f) => f.status === "verified"));
      setLastSignIn(user.last_sign_in_at ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const emailVerified = !!user.email_confirmed_at;
  const memberSince = profile?.created_at ?? user.created_at;

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Account status" description="Your personal account status, security, and activity" path="/me/status" />
      <Navbar />
      <main className="flex-1 container max-w-5xl py-8 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Account status</h1>
            <p className="text-muted-foreground text-sm mt-1">A snapshot of your profile, security, and activity.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/profile">Edit profile</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link to="/dashboard">Dashboard</Link></Button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Identity */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate">{profile?.display_name || user.email?.split("@")[0]}</CardTitle>
                  <CardDescription className="truncate">{user.email}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-end">
                  {roles.filter((r) => r !== "default").map((r) => (
                    <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>
                  ))}
                  {isAdmin && !roles.includes("admin") && !roles.includes("owner") && (
                    <Badge variant="secondary">admin</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
                <InfoRow label="Minecraft" value={profile?.mc_username || "Not linked"} />
                <InfoRow label="Discord" value={priv?.discord_username || "Not linked"} />
                <InfoRow label="Member since" value={memberSince ? format(new Date(memberSince), "PP") : "—"} />
                <InfoRow label="Last sign-in" value={lastSignIn ? formatDistanceToNow(new Date(lastSignIn), { addSuffix: true }) : "—"} />
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" /> Security</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <SecurityTile
                  ok={emailVerified}
                  icon={emailVerified ? MailCheck : Mail}
                  title="Email verified"
                  detail={emailVerified ? "Confirmed" : "Not confirmed"}
                />
                <SecurityTile
                  ok={mfaEnabled}
                  icon={mfaEnabled ? ShieldCheck : ShieldAlert}
                  title="Two-factor auth"
                  detail={mfaEnabled ? "Enabled" : "Disabled"}
                  action={!mfaEnabled ? { label: "Enable", to: "/profile" } : undefined}
                />
                <SecurityTile
                  ok={true}
                  icon={KeyRound}
                  title="Password"
                  detail="Set"
                  action={{ label: "Change", to: "/profile" }}
                />
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Flame className="h-4 w-4" /> Activity</CardTitle>
                <CardDescription>Your login and voting streaks.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <StreakBlock
                  icon={LogIn}
                  label="Login streak"
                  current={streaks?.login_streak ?? 0}
                  best={streaks?.login_best ?? 0}
                  total={streaks?.total_logins ?? 0}
                  last={streaks?.last_login_date}
                />
                <StreakBlock
                  icon={VoteIcon}
                  label="Vote streak"
                  current={streaks?.vote_streak ?? 0}
                  best={streaks?.vote_best ?? 0}
                  total={streaks?.total_votes ?? 0}
                  last={streaks?.last_vote_date}
                  action={{ label: "Vote now", to: "/vote" }}
                />
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground text-center">
              Looking for server uptime? <Link to="/status" className="underline hover:text-foreground">View public status <ExternalLink className="inline h-3 w-3" /></Link>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 min-w-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function SecurityTile({
  ok, icon: Icon, title, detail, action,
}: { ok: boolean; icon: any; title: string; detail: string; action?: { label: string; to: string } }) {
  return (
    <div className="rounded-lg border p-3 flex items-start gap-3 min-w-0">
      <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">{detail}</div>
        {action && (
          <Button asChild size="sm" variant="link" className="h-auto p-0 mt-1 text-xs">
            <Link to={action.to}>{action.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function StreakBlock({
  icon: Icon, label, current, best, total, last, action,
}: {
  icon: any; label: string; current: number; best: number; total: number;
  last?: string | null; action?: { label: string; to: string };
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-primary" /> {label}</div>
        {action && <Button asChild size="sm" variant="outline" className="h-7"><Link to={action.to}>{action.label}</Link></Button>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums">{current}</span>
        <span className="text-xs text-muted-foreground">day{current === 1 ? "" : "s"}</span>
      </div>
      <Separator className="my-3" />
      <div className="grid grid-cols-3 gap-2 text-xs">
        <Stat label="Best" value={best} />
        <Stat label="Total" value={total} />
        <Stat label="Last" value={last ? formatDistanceToNow(new Date(last), { addSuffix: true }) : "—"} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="min-w-0">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
