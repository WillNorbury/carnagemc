import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import MouseTrail from "@/components/site/MouseTrail";
import AnimatedCounter from "@/components/site/AnimatedCounter";
import Countdown from "@/components/site/Countdown";
import Reviews from "@/components/site/Reviews";
import { SEO } from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchFeatures, type Feature } from "@/lib/features";
import {
  Copy,
  Users,
  Server,
  MessageCircle,
  X,
  CheckCircle2,
  AlertCircle,
  PartyPopper,
  Zap,
  Vote as VoteIcon,
  Star,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type News = { id: string; title: string; excerpt: string | null; slug: string; created_at: string };
type Status = {
  online: boolean;
  players_online: number;
  players_max: number;
  motd: string | null;
  version?: string | null;
};
type SiteContent = Record<string, any>;

const formatUptime = (ms: number) => {
  if (ms <= 0) return "—";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const Index = () => {
  const nav = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [content, setContent] = useState<SiteContent>({});
  const [uptimeStart, setUptimeStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [popupOpen, setPopupOpen] = useState(false);

  const [discordMembers, setDiscordMembers] = useState<number | null>(null);
  const [discordInviteError, setDiscordInviteError] = useState<string | null>(null);
  const [voteCount, setVoteCount] = useState<number>(0);
  const [features, setFeatures] = useState<Feature[]>([]);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchFeatures().then(setFeatures);
  }, []);

  useEffect(() => {
    supabase
      .from("news")
      .select("id,title,excerpt,slug,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setNews(data ?? []));
    supabase
      .from("site_content")
      .select("*")
      .then(({ data }) => {
        const map: SiteContent = {};
        (data ?? []).forEach((r: any) => (map[r.key] = r.value));
        setContent(map);
      });
    const t = setTimeout(() => {
      const dismissed = sessionStorage.getItem("xylo_popup_dismissed");
      if (!dismissed) setPopupOpen(true);
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const popupCfg = {
    enabled: content.popup?.enabled ?? true,
    title: content.popup?.title ?? "Season 3 Launch — LIVE",
    description:
      content.popup?.description ??
      "New map, fresh economy, and exclusive launch crates for early players. Join now and claim your founder's reward.",
    primaryLabel: content.popup?.primaryLabel ?? "Copy IP",
    primaryUrl: content.popup?.primaryUrl ?? "",
    secondaryLabel: content.popup?.secondaryLabel ?? "Later",
  };

  // Fetch live Discord member count via server-side proxy (reliable, no CORS/rate-limit issues)
  useEffect(() => {
    const inviteRaw: string = content.server?.discord ?? "https://discord.gg/qAEs87VeXM";
    let cancelled = false;

    const load = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("discord-invite", {
          body: null,
          method: "GET",
          // @ts-ignore - query is supported at runtime
          query: { invite: inviteRaw },
        } as any);
        if (cancelled) return;
        if (!error && data?.ok && typeof data.approximate_member_count === "number") {
          setDiscordMembers(data.approximate_member_count);
          setDiscordInviteError(null);
          return;
        }
        // Fallback: direct call to the function URL with query string
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-invite?invite=${encodeURIComponent(inviteRaw)}`;
        const r = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const j = await r.json();
        if (cancelled) return;
        if (j?.ok && typeof j.approximate_member_count === "number") {
          setDiscordMembers(j.approximate_member_count);
          setDiscordInviteError(null);
        } else {
          const msg = (data as any)?.error || j?.error || error?.message || "Unknown error";
          setDiscordInviteError(msg);
        }
      } catch {
        /* silent */
      }
    };

    load();
    const poll = setInterval(load, 5 * 60_000); // refresh every 5 minutes
    return () => {
      cancelled = true;
      clearInterval(poll);
    };
  }, [content.server?.discord]);

  const ip = content.server?.ip ?? "play.havocsmp.net";
  const bedrockIp = content.server?.bedrockIp ?? "Soon";
  const bedrockPort = content.server?.bedrockPort ?? "Soon";

  const [alert, setAlert] = useState<{ type: "online" | "offline"; message: string } | null>(null);
  const prevOnlineRef = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`https://api.mcsrvstat.us/3/${encodeURIComponent(ip)}`);
        const j = await res.json();
        if (cancelled) return;
        const s: Status = {
          online: !!j.online,
          players_online: j.players?.online ?? 0,
          players_max: j.players?.max ?? 0,
          motd: Array.isArray(j.motd?.clean) ? j.motd.clean.join(" ") : null,
          version: j.version ?? null,
        };
        setStatus(s);
        if (j.online) setUptimeStart((prev) => prev ?? Date.now());
        else setUptimeStart(null);
        const prev = prevOnlineRef.current;
        if (prev !== undefined && prev !== s.online) {
          const a = content.alerts ?? {};
          if (s.online && (a.onlineEnabled ?? true)) {
            const msg = a.onlineMessage ?? "🟢 Server is back online — jump in!";
            setAlert({ type: "online", message: msg });
            toast.success(msg);
          } else if (!s.online && (a.offlineEnabled ?? true)) {
            const msg = a.offlineMessage ?? "🔴 Server is currently offline.";
            setAlert({ type: "offline", message: msg });
            toast.error(msg);
          }
        }
        prevOnlineRef.current = s.online;
      } catch {
        if (!cancelled) setStatus({ online: false, players_online: 0, players_max: 0, motd: null });
      }
    };
    fetchStatus();
    const poll = setInterval(fetchStatus, 60_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [ip, content.alerts]);

  const uptime = uptimeStart ? formatUptime(now - uptimeStart) : "—";

  const eventTarget = useMemo(() => {
    const cfg = content.event?.targetMs;
    if (cfg && typeof cfg === "number") return cfg;
    // default: next Saturday 8pm local
    const d = new Date();
    const day = d.getDay();
    const add = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + add);
    d.setHours(20, 0, 0, 0);
    return d.getTime();
  }, [content.event]);

  const eventLabel = content.event?.label ?? "Next Event Reset";

  const heroTitle = "Welcome to HavocSMP";
  const heroSub = "The ultimate Minecraft Lifesteal & Economy experience.";

  const copyIp = () => {
    navigator.clipboard.writeText(ip);
    toast.success("Server IP copied");
  };
  const dismissPopup = () => {
    setPopupOpen(false);
    sessionStorage.setItem("xylo_popup_dismissed", "1");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="HavocSMP — DonutSMP Copy"
        description="Join HavocSMP for premium Lifesteal PvP, custom enchants, a player-driven economy, ranked seasons, and weekly events. Java & Bedrock supported."
        path="/"
      />
      <MouseTrail />
      <Navbar />

      {isAdmin && discordInviteError && (
        <div className="container pt-4">
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 text-destructive p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-semibold">Discord invite is expired or invalid</p>
              <p className="text-destructive/80 mt-1">
                {discordInviteError}. Generate a new <strong>permanent</strong> invite in your Discord server (Server
                Settings → Invites → set to Never expire), then paste it in{" "}
                <strong>Admin → Site Content → Server → Discord URL</strong>.
              </p>
            </div>
            <button
              onClick={() => setDiscordInviteError(null)}
              className="text-destructive/60 hover:text-destructive"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Popup announcement */}
      {popupOpen && popupCfg.enabled && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="relative max-w-md w-full p-7 border-primary/40 shadow-elegant overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ background: "var(--gradient-fire)" }} />
            <button
              onClick={dismissPopup}
              className="absolute top-3 right-3 p-1 rounded hover:bg-secondary transition"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="relative">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary mb-4 animate-pulse-glow">
                <PartyPopper className="h-5 w-5" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">{popupCfg.title}</h3>
              <p className="text-sm text-muted-foreground mb-5">{popupCfg.description}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (popupCfg.primaryUrl) {
                      window.open(popupCfg.primaryUrl, "_blank", "noopener,noreferrer");
                    } else {
                      copyIp();
                    }
                    dismissPopup();
                  }}
                  className="flex-1 glow"
                >
                  {!popupCfg.primaryUrl && <Copy className="h-4 w-4 mr-2" />}
                  {popupCfg.primaryLabel}
                </Button>
                <Button variant="outline" onClick={dismissPopup}>
                  {popupCfg.secondaryLabel}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {alert && (
        <div className="fixed top-16 inset-x-0 z-40 px-4 animate-in slide-in-from-top duration-300">
          <div
            className={`container max-w-3xl flex items-center gap-3 p-4 rounded-lg border backdrop-blur-xl shadow-elegant ${alert.type === "online" ? "bg-primary/15 border-primary/40" : "bg-destructive/15 border-destructive/40"}`}
          >
            {alert.type === "online" ? (
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <p className="flex-1 text-sm font-medium">{alert.message}</p>
            <button
              onClick={() => setAlert(null)}
              className="opacity-70 hover:opacity-100 transition"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      {content.hero?.enabled !== false && (
        <section className="relative min-h-[92vh] flex items-center overflow-hidden pt-16">
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
          <div className="absolute inset-0 bg-grid opacity-[0.15]" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          <Particles count={40} />
          {/* glowing orbs */}
          <div className="absolute -top-20 -left-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px] animate-float" />
          <div
            className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-accent/20 blur-[120px] animate-float"
            style={{ animationDelay: "2s" }}
          />

          <div className="container relative z-10 text-center py-20">
            <Badge
              variant="secondary"
              className="mb-6 text-primary border-primary/40 px-4 py-1.5 text-xs uppercase tracking-[0.2em] backdrop-blur-md"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse mr-2" />
              Season 3 — Now Live
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[1.05]">
              Welcome to <span className="text-gradient text-glow">HavocSMP</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {heroSub} Forge alliances. Steal hearts. Build legacies.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Button
                size="lg"
                onClick={copyIp}
                className="glow font-display uppercase tracking-wider px-7 animate-pulse-glow"
              >
                <Server className="h-4 w-4 mr-2" /> Join Server
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="font-display uppercase tracking-wider px-7 border-primary/40 hover:border-primary hover:text-primary"
              >
                <a href={content.server?.discord ?? "https://discord.havocsmp.net"} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Discord
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => nav("/vote")}
                className="font-display uppercase tracking-wider px-7 border-primary/40 hover:border-primary hover:text-primary"
              >
                <VoteIcon className="h-4 w-4 mr-2" /> Vote
              </Button>
            </div>

            {/* IP card */}
            <div className="max-w-lg mx-auto">
              <button onClick={copyIp} className="group w-full relative">
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-accent opacity-60 group-hover:opacity-100 blur transition" />
                <div className="relative flex items-center justify-between gap-3 px-6 py-4 rounded-xl bg-card border border-primary/30">
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Java IP</div>
                    <div className="font-mono text-lg md:text-2xl font-bold">{ip}</div>
                  </div>
                  <div className="flex items-center gap-2 text-primary group-hover:scale-110 transition">
                    <Copy className="h-5 w-5" />
                    <span className="text-xs uppercase tracking-wider hidden sm:inline">Copy</span>
                  </div>
                </div>
              </button>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="px-4 py-3 rounded-xl bg-card border border-primary/20">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Bedrock IP</div>
                  <div className="font-mono text-sm md:text-base font-semibold">{bedrockIp}</div>
                </div>
                <div className="px-4 py-3 rounded-xl bg-card border border-primary/20">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Bedrock Port</div>
                  <div className="font-mono text-sm md:text-base font-semibold">{bedrockPort}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span
                  className={`h-2 w-2 rounded-full ${status?.online ? "bg-primary animate-pulse" : "bg-destructive"}`}
                />
                {status?.online ? `${status.players_online} players online` : "Server offline"}
                {status?.version && <span className="opacity-60">• {status.version}</span>}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Server stats counters */}
      <section className="relative py-20 border-y border-primary/10">
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
        <div className="container relative grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Online Players", value: status?.players_online ?? 0, icon: Users, suffix: "" },
            { label: "Discord Members", value: discordMembers ?? 0, icon: MessageCircle, suffix: "" },
            { label: "Total Votes", value: voteCount, icon: Star, suffix: "" },
            { label: "Uptime", value: 99.9, icon: Zap, suffix: "%", decimals: 1 },
          ].map((s) => (
            <Card
              key={s.label}
              className="p-6 text-center hover-lift hover-glow border-primary/10 bg-card/60 backdrop-blur"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="font-display text-3xl md:text-4xl font-bold text-gradient">
                <AnimatedCounter to={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
              </div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      </section>

      <main className="container space-y-28 py-24">
        {/* Features */}
        <section id="features">
          <SectionHead
            eyebrow="Features"
            title="Built for Legends"
            sub="Every system, every detail — engineered to make your gameplay matter."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.slice(0, 8).map((f) => (
              <Card
                key={f.slug}
                onClick={() => nav(`/features/${f.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    nav(`/features/${f.slug}`);
                  }
                }}
                className="group relative p-6 hover-lift hover-glow border-border/60 overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)/0.06), transparent)" }}
                />
                <div className="relative">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-primary flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] transition">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                  <div className="mt-3 inline-flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition">
                    Read more <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => nav("/features")}
              className="font-display uppercase tracking-wider border-primary/40 hover:border-primary hover:text-primary"
            >
              View all features <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </section>

        {/* Countdown */}
        <section>
          <Card className="relative p-10 md:p-14 overflow-hidden border-primary/30 text-center scan-line">
            <div className="absolute inset-0 opacity-25" style={{ background: "var(--gradient-fire)" }} />
            <div className="absolute inset-0 bg-grid opacity-[0.1]" />
            <div className="relative">
              <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
                Mark your calendar
              </Badge>
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-2">Don't Miss the Action</h2>
              <p className="text-muted-foreground mb-8">Big things drop weekly. Be here when the timer hits zero.</p>
              <Countdown target={eventTarget} label={eventLabel} />
            </div>
          </Card>
        </section>

        {/* News */}
        {news.length > 0 && (
          <section id="news">
            <SectionHead
              eyebrow="Updates"
              title="Latest News"
              sub="Patch notes, events, and community announcements."
            />
            <div className="grid md:grid-cols-3 gap-5">
              {news.map((n) => (
                <Card
                  key={n.id}
                  onClick={() => nav(`/news/${n.slug}`)}
                  className="p-6 hover-lift hover-glow cursor-pointer group"
                >
                  <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2 group-hover:text-primary transition">{n.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
                  <div className="mt-4 inline-flex items-center text-sm text-primary opacity-0 group-hover:opacity-100 transition">
                    Read more <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section>
          <SectionHead eyebrow="Reviews" title="What Players Say" sub="Real voices from the HavocSMP community." />
          <Reviews />
        </section>

        {/* CTA */}
        <section>
          <Card className="relative p-12 md:p-16 text-center overflow-hidden border-primary/40">
            <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-fire)" }} />
            <div className="absolute inset-0 bg-grid opacity-[0.1]" />
            <Particles count={20} />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">
                Ready to <span className="text-gradient">Dominate?</span>
              </h2>
              <p className="text-muted-foreground mb-7 max-w-xl mx-auto">
                Thousands of players. One server. Your story starts the moment you log in.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button size="lg" onClick={copyIp} className="glow font-display uppercase tracking-wider px-7">
                  <Copy className="h-4 w-4 mr-2" /> Copy Server IP
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => nav("/auth")}
                  className="font-display uppercase tracking-wider px-7 border-primary/40 hover:border-primary"
                >
                  Create Account
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const SectionHead = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) => (
  <div className="text-center mb-12">
    <div className="text-xs uppercase tracking-[0.3em] text-primary mb-3 font-semibold">{eyebrow}</div>
    <h2 className="font-display text-3xl md:text-5xl font-bold mb-3">{title}</h2>
    <p className="text-muted-foreground max-w-2xl mx-auto">{sub}</p>
  </div>
);

export default Index;
