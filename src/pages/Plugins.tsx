import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Puzzle, Search, Sparkles, Clock, Filter, X } from "lucide-react";

type Plugin = {
  id: string;
  short_id: string;
  slug: string | null;
  name: string;
  description: string | null;
  version: string | null;
  author: string | null;
  user_id: string | null;
  icon_url: string | null;
  category: string | null;
  tags: string[];
  platform: string | null;
  platforms: string[] | null;
  mc_versions: string[] | null;
  featured: boolean;
  updated_at: string;
};

type CreatorProfile = { display_name: string | null; mc_username: string | null };

const CATEGORIES = [
  "Adventure", "Economy", "Equipment", "Game Mechanics", "Library",
  "Magic", "Management", "Minigame", "Mobs", "Optimization",
  "Social", "Storage", "Utility", "World Generation",
];

const PLATFORM_COLORS: Record<string, string> = {
  bukkit: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  spigot: "border-orange-500/40 text-orange-400 bg-orange-500/10",
  paper: "border-rose-500/40 text-rose-400 bg-rose-500/10",
  purpur: "border-purple-500/40 text-purple-400 bg-purple-500/10",
  folia: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  bungeecord: "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
  velocity: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
  waterfall: "border-blue-500/40 text-blue-400 bg-blue-500/10",
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
};

const Plugins = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [creators, setCreators] = useState<Record<string, CreatorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"featured" | "updated" | "name">("featured");

  useEffect(() => {
    document.title = "Plugins — CarnageMC";
    (async () => {
      const { data } = await supabase
        .from("plugins")
        .select("id, short_id, slug, name, description, version, author, user_id, icon_url, category, tags, platform, platforms, mc_versions, featured, updated_at")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("updated_at", { ascending: false });
      const rows = (data ?? []) as Plugin[];
      setPlugins(rows);
      const ids = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean) as string[]));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name, mc_username")
          .in("id", ids);
        const map: Record<string, CreatorProfile> = {};
        (profs ?? []).forEach((p: any) => {
          map[p.id] = { display_name: p.display_name, mc_username: p.mc_username };
        });
        setCreators(map);
      }
      setLoading(false);
    })();
  }, []);

  const toggleCat = (c: string) =>
    setActiveCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const filtered = useMemo(() => {
    let res = plugins.filter((p) => {
      if (activeCats.length > 0) {
        const tagSet = new Set([(p.category ?? "").toLowerCase(), ...p.tags.map((t) => t.toLowerCase())]);
        if (!activeCats.some((c) => tagSet.has(c.toLowerCase()))) return false;
      }
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (
        p.name.toLowerCase().includes(s) ||
        (p.description ?? "").toLowerCase().includes(s) ||
        (p.author ?? "").toLowerCase().includes(s) ||
        (p.category ?? "").toLowerCase().includes(s) ||
        p.tags.some((t) => t.toLowerCase().includes(s))
      );
    });
    if (sortBy === "updated") {
      res = [...res].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sortBy === "name") {
      res = [...res].sort((a, b) => a.name.localeCompare(b.name));
    }
    return res;
  }, [plugins, q, activeCats, sortBy]);

  const featured = plugins.filter((p) => p.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16">
        {/* Hero */}
        <div className="relative mb-10 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/60 to-transparent p-8 md:p-12 overflow-hidden">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Puzzle className="h-3 w-3" /> Plugin Directory
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight mb-3">
              Discover <span className="text-gradient">plugins</span>
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Explore community-made and official plugins built for the CarnageMC network.
            </p>
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-display font-bold text-lg">Featured</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {featured.map((p) => (
                <Link key={p.id} to={`/plugin/${p.slug ?? p.short_id}`}>
                  <Card className="p-4 h-full hover:border-primary/60 hover:shadow-elegant transition group">
                    <div className="flex gap-3 items-start">
                      {p.icon_url ? (
                        <img src={p.icon_url} alt="" className="h-12 w-12 rounded-md border border-border object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <Puzzle className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-semibold group-hover:text-primary transition truncate">{p.name}</div>
                        {p.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <h3 className="font-display font-semibold">Categories</h3>
                </div>
                {activeCats.length > 0 && (
                  <button
                    onClick={() => setActiveCats([])}
                    className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Clear
                  </button>
                )}
              </div>
              <ul className="space-y-1">
                {CATEGORIES.map((c) => {
                  const active = activeCats.includes(c);
                  return (
                    <li key={c}>
                      <button
                        onClick={() => toggleCat(c)}
                        className={`w-full text-left text-sm px-2.5 py-1.5 rounded-md transition ${
                          active
                            ? "text-primary bg-primary/10 border border-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent"
                        }`}
                      >
                        {c}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </aside>

          {/* Main list */}
          <section>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search plugins..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-11"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-11 bg-card border border-border rounded-md px-3 text-sm text-foreground"
              >
                <option value="featured">Featured first</option>
                <option value="updated">Recently updated</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>

            <div className="text-sm text-muted-foreground mb-3">
              {loading ? "Loading…" : `${filtered.length} plugin${filtered.length === 1 ? "" : "s"}`}
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-12">Loading plugins...</p>
            ) : filtered.length === 0 ? (
              <Card className="p-12 text-center">
                <Puzzle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground">No plugins match your filters.</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {filtered.map((p) => {
                  const basePlatforms = p.platforms && p.platforms.length ? p.platforms : p.platform ? [p.platform] : [];
                  const platforms = [...basePlatforms, ...p.tags.filter((t) => PLATFORM_COLORS[t.toLowerCase()])]
                    .filter(Boolean)
                    .filter((v, i, a) => a.findIndex((x) => x?.toLowerCase() === v?.toLowerCase()) === i) as string[];
                  const creator = p.user_id ? creators[p.user_id] : undefined;
                  const username = creator?.display_name || creator?.mc_username || p.author;

                  return (
                    <Link key={p.id} to={`/plugin/${p.slug ?? p.short_id}`}>
                      <Card className="p-4 h-full hover:border-primary/50 hover:shadow-elegant transition group">
                        <div className="flex gap-3">
                          {p.icon_url ? (
                            <img
                              src={p.icon_url}
                              alt=""
                              className="h-14 w-14 rounded-md object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                              <Puzzle className="h-7 w-7 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-display font-semibold group-hover:text-primary transition truncate">
                                {p.name}
                              </h3>
                              {p.featured && <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />}
                            </div>
                            {username && (
                              <div className="text-xs text-muted-foreground truncate">
                                by <span className="text-foreground/80">{username}</span>
                                {p.version && <span className="ml-1.5 opacity-70">v{p.version}</span>}
                              </div>
                            )}
                            {p.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5">
                                {p.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {p.category && (
                                <Badge variant="secondary" className="text-[10px]">{p.category}</Badge>
                              )}
                              {platforms.slice(0, 3).map((pl) => (
                                <Badge
                                  key={pl}
                                  variant="outline"
                                  className={`text-[10px] ${PLATFORM_COLORS[pl.toLowerCase()] ?? ""}`}
                                >
                                  {pl}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-2">
                              <Clock className="h-3 w-3" />
                              Updated {timeAgo(p.updated_at)}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Plugins;
