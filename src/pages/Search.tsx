import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard, PageHero } from "@/components/site/ui-kit";
import { userProfilePath } from "@/lib/userSlug";
import { cn } from "@/lib/utils";
import {
  Search as SearchIcon,
  Newspaper,
  Puzzle,
  Sparkles,
  Users as UsersIcon,
  HelpCircle,
  Calendar,
  Home,
  ShieldCheck,
  Vote as VoteIcon,
  ScrollText,
  LifeBuoy,
  Trophy,
  ClipboardList,
  Loader2,
  FileText,
  Server,
} from "lucide-react";

type Hit = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  to: string;
  icon: any;
};

const PAGES: Hit[] = [
  { id: "p-home", type: "Page", title: "Home", subtitle: "Server overview and IP", to: "/", icon: Home },
  { id: "p-news", type: "Page", title: "News", subtitle: "Announcements and updates", to: "/news", icon: Newspaper },
  { id: "p-changelog", type: "Page", title: "Changelog", subtitle: "Every shipped change", to: "/changelog", icon: ClipboardList },
  { id: "p-staff", type: "Page", title: "Staff", subtitle: "Meet the team", to: "/staff", icon: ShieldCheck },
  { id: "p-vote", type: "Page", title: "Vote", subtitle: "Vote for rewards", to: "/vote", icon: VoteIcon },
  { id: "p-rules", type: "Page", title: "Rules", subtitle: "Code of conduct", to: "/rules", icon: ScrollText },
  { id: "p-plugins", type: "Page", title: "Plugins", subtitle: "Community plugins", to: "/plugins", icon: Puzzle },
  { id: "p-servers", type: "Page", title: "Servers", subtitle: "Server directory", to: "/servers", icon: Server },
  { id: "p-tiers", type: "Page", title: "Player Tiers", subtitle: "LT1–HT5 tier list", to: "/tiers", icon: Trophy },
  { id: "p-seasons", type: "Page", title: "Seasons", subtitle: "Season history and winners", to: "/seasons", icon: Calendar },
  { id: "p-features", type: "Page", title: "Features", subtitle: "Gameplay systems", to: "/features", icon: Sparkles },
  { id: "p-faq", type: "Page", title: "FAQ", subtitle: "Common questions", to: "/faq", icon: HelpCircle },
  { id: "p-events", type: "Page", title: "Events", subtitle: "Upcoming events", to: "/events", icon: Calendar },
  { id: "p-leaderboard", type: "Page", title: "Leaderboard", subtitle: "Top players", to: "/leaderboard", icon: Trophy },
  { id: "p-users", type: "Page", title: "Members", subtitle: "Browse members", to: "/users", icon: UsersIcon },
  { id: "p-support", type: "Page", title: "Support", subtitle: "Get help", to: "/support", icon: LifeBuoy },
  { id: "p-status", type: "Page", title: "Status", subtitle: "Network uptime", to: "/status", icon: FileText },
];

const FILTERS = ["All", "Page", "News", "Plugin", "Feature", "Player", "FAQ", "Event", "Wiki"] as const;
type Filter = (typeof FILTERS)[number];

const SearchPage = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("All");

  useEffect(() => setInput(q), [q]);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const like = `%${term}%`;
      const results: Hit[] = [];
      const [news, plugins, features, profiles, faqs, events, wiki] = await Promise.all([
        supabase.from("news").select("id,title,slug,excerpt").eq("published", true).ilike("title", like).limit(20),
        supabase.from("plugins").select("id,short_id,slug,name,description").eq("published", true).ilike("name", like).limit(20),
        supabase.from("features").select("id,title,slug,description").eq("published", true).ilike("title", like).limit(20),
        supabase.from("profiles").select("id,display_name,mc_username").or(`display_name.ilike.${like},mc_username.ilike.${like}`).limit(20),
        (supabase.from("faqs" as any) as any).select("id,question,answer").eq("published", true).ilike("question", like).limit(20),
        (supabase.from("events" as any) as any).select("id,title,slug,description").eq("published", true).ilike("title", like).limit(20),
        (supabase.from("wiki_articles" as any) as any).select("id,title,slug,excerpt").ilike("title", like).limit(20),
      ]);

      (news.data ?? []).forEach((n: any) =>
        results.push({ id: `n-${n.id}`, type: "News", title: n.title, subtitle: n.excerpt ?? undefined, to: `/news/${n.slug}`, icon: Newspaper }),
      );
      (plugins.data ?? []).forEach((p: any) =>
        results.push({ id: `pl-${p.id}`, type: "Plugin", title: p.name, subtitle: p.description ?? undefined, to: `/plugin/${p.slug ?? p.short_id}`, icon: Puzzle }),
      );
      (features.data ?? []).forEach((f: any) =>
        results.push({ id: `f-${f.id}`, type: "Feature", title: f.title, subtitle: f.description ?? undefined, to: `/features/${f.slug}`, icon: Sparkles }),
      );
      (profiles.data ?? []).forEach((u: any) =>
        results.push({
          id: `u-${u.id}`,
          type: "Player",
          title: u.display_name || u.mc_username || "Player",
          subtitle: u.mc_username ?? undefined,
          to: userProfilePath(u),
          icon: UsersIcon,
        }),
      );
      (faqs.data ?? []).forEach((f: any) =>
        results.push({ id: `q-${f.id}`, type: "FAQ", title: f.question, subtitle: f.answer ?? undefined, to: `/faq`, icon: HelpCircle }),
      );
      (events.data ?? []).forEach((e: any) =>
        results.push({ id: `e-${e.id}`, type: "Event", title: e.title, subtitle: e.description ?? undefined, to: `/events`, icon: Calendar }),
      );
      (wiki.data ?? []).forEach((w: any) =>
        results.push({ id: `w-${w.id}`, type: "Wiki", title: w.title, subtitle: w.excerpt ?? undefined, to: `/wiki/${w.slug}`, icon: FileText }),
      );

      if (!cancelled) {
        setHits(results);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q]);

  const pageHits = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return PAGES.filter(
      (p) => p.title.toLowerCase().includes(term) || (p.subtitle ?? "").toLowerCase().includes(term) || p.to.includes(term),
    );
  }, [q]);

  const all = useMemo(() => [...pageHits, ...hits], [pageHits, hits]);
  const shown = useMemo(() => (filter === "All" ? all : all.filter((h) => h.type === filter)), [all, filter]);
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    all.forEach((h) => (c[h.type] = (c[h.type] ?? 0) + 1));
    return c;
  }, [all]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setParams(input.trim() ? { q: input.trim() } : {});
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <SEO
        title={q ? `Search: ${q} — CarnageMC` : "Search — CarnageMC"}
        description="Search CarnageMC news, plugins, players, wiki guides, FAQs, events, and pages."
        path="/search"
      />
      <Navbar />

      <main className="flex-1">
        <PageHero eyebrow="Find anything" title="Search" description="News, plugins, players, guides, and pages." />

        <div className="container mx-auto px-4 pb-20 max-w-3xl space-y-6">
          <form onSubmit={submit} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search news, plugins, players, guides…"
                className="pl-9"
                aria-label="Search query"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {q.trim() && (
            <div className="flex flex-wrap gap-2">
              {FILTERS.filter((f) => f === "All" || counts[f]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  className="rounded-full"
                >
                  {f}
                  <Badge variant="secondary" className="ml-2 rounded-full px-1.5">
                    {f === "All" ? all.length : counts[f] ?? 0}
                  </Badge>
                </Button>
              ))}
            </div>
          )}

          {!q.trim() ? (
            <GlassCard className="p-8">
              <p className="text-sm text-muted-foreground mb-4">Start typing, or jump to a popular page:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAGES.slice(0, 10).map((p) => {
                  const Icon = p.icon;
                  return (
                    <Link
                      key={p.id}
                      to={p.to}
                      className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-primary/5 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium">{p.title}</span>
                    </Link>
                  );
                })}
              </div>
            </GlassCard>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : shown.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <p className="text-muted-foreground">
                No results for “{q}”. Try a shorter or different term.
              </p>
            </GlassCard>
          ) : (
            <GlassCard className="divide-y divide-border/50 overflow-hidden">
              {shown.map((h) => {
                const Icon = h.icon;
                return (
                  <Link key={h.id} to={h.to} className={cn("flex items-center gap-4 p-4 transition-colors hover:bg-primary/5")}>
                    <Icon className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{h.title}</div>
                      {h.subtitle && <div className="text-xs text-muted-foreground truncate">{h.subtitle}</div>}
                      <div className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{h.to}</div>
                    </div>
                    <Badge variant="outline" className="rounded-full shrink-0">{h.type}</Badge>
                  </Link>
                );
              })}
            </GlassCard>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchPage;
