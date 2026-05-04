import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import island from "@/assets/zyphora-island.png";
import bg from "@/assets/zyphora-bg.png";
import { Copy, Users, Server, MessageCircle, Shield, Coins, Heart } from "lucide-react";
import { toast } from "sonner";

type News = { id: string; title: string; excerpt: string | null; slug: string; created_at: string };
type Status = { online: boolean; players_online: number; players_max: number; motd: string | null; version?: string | null };
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

const RULES = [
  { icon: Shield, title: "Fair Play", desc: "Hacks, macros, and x-ray are strictly forbidden. Suspicious activity is reviewed via logs." },
  { icon: Heart, title: "Community Respect", desc: "Hate speech, toxicity and discrimination result in permanent bans." },
  { icon: Coins, title: "Economy Balance", desc: "Market manipulation and dupes are tracked. Offending accounts are reset." },
];

const FAQS = [
  { q: "What version & mods does the server run?", a: "Paper 1.21.x with custom optimizations and ItemsAdder/Oraxen content packs." },
  { q: "Can I join with a non-premium account?", a: "Yes. ZyphoraID lets cracked players join securely. 2FA is mandatory for non-premium accounts." },
  { q: "Is the server stable? Any lag?", a: "We guarantee 99.9% uptime with a public TPS dashboard. All lag spikes are logged and reviewed." },
  { q: "How are rules updated?", a: "Rules are reviewed at least once a year. Changes are posted on this site and announced in Discord." },
];

const Index = () => {
  const nav = useNavigate();
  const [news, setNews] = useState<News[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [content, setContent] = useState<SiteContent>({});
  const [uptimeStart, setUptimeStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    supabase.from("news").select("id,title,excerpt,slug,created_at").eq("published", true).order("created_at", { ascending: false }).limit(3).then(({ data }) => setNews(data ?? []));
    supabase.from("site_content").select("*").then(({ data }) => {
      const map: SiteContent = {};
      (data ?? []).forEach((r: any) => (map[r.key] = r.value));
      setContent(map);
    });
  }, []);

  const ip = content.server?.ip ?? "play.zyphoramc.net";

  // Live Minecraft server status via mcsrvstat.us (no key required)
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
        if (j.online) {
          setUptimeStart((prev) => prev ?? Date.now());
        } else {
          setUptimeStart(null);
        }
      } catch {
        if (!cancelled) setStatus({ online: false, players_online: 0, players_max: 0, motd: null });
      }
    };
    fetchStatus();
    const poll = setInterval(fetchStatus, 60_000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => { cancelled = true; clearInterval(poll); clearInterval(tick); };
  }, [ip]);

  const uptime = uptimeStart ? formatUptime(now - uptimeStart) : "—";

  const heroTitle = content.hero?.title ?? "Join the Adventure";
  const heroSub = content.hero?.subtitle ?? "Explore, build, and forge legends in Zyphora's unique survival world.";
  const heroBadge = content.hero?.badge ?? "Minecraft 1.21.x • Paper";

  const copyIp = () => { navigator.clipboard.writeText(ip); toast.success("Server IP copied"); };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 bg-grid opacity-[0.07]" />
        <div className="container relative grid lg:grid-cols-2 gap-10 items-center py-16">
          <div>
            <Badge variant="secondary" className="mb-5 text-primary border-primary/30">{heroBadge}</Badge>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-[1.05]">
              {heroTitle.split(" ").slice(0, -1).join(" ")} <span className="text-gradient">{heroTitle.split(" ").slice(-1)[0]}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl">{heroSub}</p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={copyIp} className="glow">
                <Copy className="h-4 w-4 mr-2" /> Copy Server IP
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={content.server?.discord ?? "https://discord.zyphoramc.net"} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Join Discord
                </a>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 bg-primary/20 blur-3xl rounded-full" />
            <Card className="relative p-8 bg-card/80 backdrop-blur-xl border-primary/20 shadow-elegant">
              <img src={island} alt="Zyphora island" className="w-full h-56 object-contain mb-4" />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Server IP</div>
              <button onClick={copyIp} className="w-full font-mono text-2xl font-bold py-3 rounded-lg bg-secondary hover:bg-secondary/70 transition border border-border">
                {ip}
              </button>
              <div className="grid grid-cols-2 gap-3 mt-5 text-center">
                <Stat icon={<Users className="h-4 w-4" />} label="Players" value={`${status?.players_online ?? 0}/${status?.players_max ?? 0}`} />
                <Stat icon={<div className={`h-2 w-2 rounded-full ${status?.online ? "bg-primary animate-pulse" : "bg-destructive"}`} />} label="Status" value={status?.online ? "Live" : "Down"} />
                <Stat icon={<Server className="h-4 w-4" />} label="Uptime" value={uptime} />
                <Stat icon={<MessageCircle className="h-4 w-4" />} label="Version" value={status?.version ?? "—"} />
              </div>
            </Card>
          </div>
        </div>
      </section>

      <main className="container space-y-24 pb-12">
        {/* News */}
        <section id="news">
          <SectionHead eyebrow="Updates" title="Latest News" sub="Patch notes, events and community announcements" />
          {news.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No news yet — admins can publish from the dashboard.</Card>
          ) : (
            <div className="grid md:grid-cols-3 gap-5">
              {news.map((n) => (
                <Card key={n.id} className="p-6 hover:border-primary/50 transition group cursor-pointer">
                  <div className="text-xs text-muted-foreground mb-2">{new Date(n.created_at).toLocaleDateString()}</div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition">{n.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Rules */}
        <section id="rules">
          <SectionHead eyebrow="Rules" title="Server Rules" sub="Core principles that keep our community thriving" />
          <div className="grid md:grid-cols-3 gap-5">
            {RULES.map((r) => (
              <Card key={r.title} className="p-6 hover:border-primary/40 transition">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ToS */}
        <section id="tos">
          <SectionHead eyebrow="Legal" title="Terms of Service" sub="Using ZyphoraMC services constitutes acceptance of these terms" />
          <div className="grid md:grid-cols-2 gap-5">
            {[
              ["Service Scope", "Server, web and launcher infrastructure are provided by ZyphoraMC. Reasonable effort is made to maintain service continuity."],
              ["Account Responsibility", "Account security is the player's responsibility. Contact support for unauthorized access."],
              ["Payments & Refunds", "Store purchases are digital content. Refund terms comply with applicable consumer protection laws."],
              ["Sanctions", "Rule violations may result in warnings, temporary or permanent bans. All decisions include transparent reasoning."],
            ].map(([t, d]) => (
              <Card key={t} className="p-6">
                <h3 className="font-bold mb-2">{t}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy">
          <SectionHead eyebrow="Privacy" title="Privacy Policy" sub="We take data protection seriously" />
          <div className="grid md:grid-cols-3 gap-5">
            {[
              ["Data Collected", "IP address, in-game stats, store transactions, support records — all stored compliantly."],
              ["Retention", "Data is encrypted while accounts remain active and anonymized after 12 months of inactivity."],
              ["Your Rights", "Request access, correction, deletion or portability via privacy@zyphoramc.net."],
            ].map(([t, d]) => (
              <Card key={t} className="p-6">
                <h3 className="font-bold mb-2">{t}</h3>
                <p className="text-sm text-muted-foreground">{d}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <SectionHead eyebrow="Help" title="Frequently Asked Questions" sub="Everything you need to know" />
          <Card className="p-2 md:p-6">
            <Accordion type="single" collapsible>
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* CTA */}
        <section>
          <Card className="p-12 text-center relative overflow-hidden border-primary/30">
            <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-primary)" }} />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-3">Ready to play?</h2>
              <p className="text-muted-foreground mb-6">Create your ZyphoraMC account and join thousands of players.</p>
              <Button size="lg" onClick={() => nav("/auth")} className="glow">Create account</Button>
            </div>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const SectionHead = ({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) => (
  <div className="text-center mb-10">
    <div className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{eyebrow}</div>
    <h2 className="text-3xl md:text-4xl font-bold mb-2">{title}</h2>
    <p className="text-muted-foreground">{sub}</p>
  </div>
);

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) => (
  <div className="rounded-lg bg-secondary/50 p-3">
    <div className="flex items-center justify-center mb-1 text-primary">{icon}</div>
    <div className="text-lg font-bold">{value}</div>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
  </div>
);

export default Index;
