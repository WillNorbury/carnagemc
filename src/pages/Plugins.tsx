import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Puzzle, Search, Sparkles, Clock, Filter, X, Download, TrendingUp, Heart } from "lucide-react";
import FoliaBadge, { supportsFolia } from "@/components/site/FoliaBadge";

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

type Counts = { total: number; last_7d: number };

const Plugins = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [creators, setCreators] = useState<Record<string, CreatorProfile>>({});
  const [downloads, setDownloads] = useState<Record<string, Counts>>({});
  const [favorites, setFavorites] = useState<Record<string, number>>({});
  const [trendingIds, setTrendingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"featured" | "updated" | "name" | "downloads">("featured");

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
      const pluginIds = rows.map((r) => r.id);

      const [profRes, dlRes, favRes, trendRes]: any = await Promise.all([
        ids.length
          ? supabase.from("profiles").select("id, display_name, mc_username").in("id", ids)
          : Promise.resolve({ data: [] }),
        pluginIds.length
          ? supabase.rpc("get_plugin_download_counts" as any, { _plugin_ids: pluginIds })
          : Promise.resolve({ data: [] }),
        pluginIds.length
          ? supabase.rpc("get_plugin_favorite_counts" as any, { _plugin_ids: pluginIds })
          : Promise.resolve({ data: [] }),
        supabase.rpc("get_trending_plugins" as any, { _days: 7, _limit: 6 }),
      ]);

      const map: Record<string, CreatorProfile> = {};
      (profRes.data ?? []).forEach((p: any) => {
        map[p.id] = { display_name: p.display_name, mc_username: p.mc_username };
      });
      setCreators(map);

      const dl: Record<string, Counts> = {};
      (dlRes.data ?? []).forEach((r: any) => {
        dl[r.plugin_id] = { total: Number(r.total) || 0, last_7d: Number(r.last_7d) || 0 };
      });
      setDownloads(dl);

      const fv: Record<string, number> = {};
      (favRes.data ?? []).forEach((r: any) => { fv[r.plugin_id] = Number(r.total) || 0; });
      setFavorites(fv);

      setTrendingIds(((trendRes.data ?? []) as any[]).map((r) => r.plugin_id));

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
    } else if (sortBy === "downloads") {
      res = [...res].sort((a, b) => (downloads[b.id]?.total ?? 0) - (downloads[a.id]?.total ?? 0));
    }
    return res;
  }, [plugins, q, activeCats, sortBy, downloads]);

  const featured = plugins.filter((p) => p.featured).slice(0, 3);
  const trending = trendingIds
    .map((id) => plugins.find((p) => p.id === id))
    .filter(Boolean) as Plugin[];
  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n);

  const totalDownloads = Object.values(downloads).reduce((s, d) => s + (d?.total ?? 0), 0);
  const totalFavorites = Object.values(favorites).reduce((s, n) => s + (n ?? 0), 0);
  const lastUpdated = plugins[0]?.updated_at;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-[1400px]">
        {/* Command-center header */}
        <div className="relative mb-6 rounded-2xl border border-orange-500/30 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.2),transparent_60%),linear-gradient(135deg,hsl(var(--card))_0%,hsl(var(--background))_100%)] overflow-hidden">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-0">
            <div className="p-6 md:p-8 border-b md:border-b-0 md:border-r border-orange-500/20">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-orange-300 mb-4">
                <Puzzle className="h-3 w-3" /> Forge · Plugin Directory
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-black tracking-tight leading-[0.95]">
                Plugin{" "}
                <span className="bg-gradient-to-br from-orange-300 via-orange-500 to-rose-600 bg-clip-text text-transparent">
                  command deck
                </span>
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base max-w-lg">
                Every plugin forged for the network — search, filter, and deploy in one view.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-orange-500/10">
              {[
                { label: "Plugins live", value: plugins.length, icon: Puzzle, tone: "text-orange-300" },
                { label: "Featured", value: featured.length, icon: Sparkles, tone: "text-amber-300" },
                { label: "Downloads", value: fmt(totalDownloads), icon: Download, tone: "text-emerald-300" },
                { label: "Favorites", value: fmt(totalFavorites), icon: Heart, tone: "text-rose-300" },
              ].map((s) => (
                <div key={s.label} className="bg-card/60 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <s.icon className={`h-3 w-3 ${s.tone}`} /> {s.label}
                  </div>
                  <div className={`font-display font-black text-2xl md:text-3xl mt-1 ${s.tone}`}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 md:px-8 py-2.5 border-t border-orange-500/20 bg-black/20 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Feed online</span>
            <span>·</span>
            <span>{loading ? "Syncing…" : `${filtered.length} matching`}</span>
            {lastUpdated && <><span>·</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last update {timeAgo(lastUpdated)}</span></>}
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-orange-400 to-rose-600" />
                <Sparkles className="h-4 w-4 text-orange-400" />
                <h2 className="font-display font-bold text-sm uppercase tracking-wider">Featured</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              {featured.map((p) => (
                <Link key={p.id} to={`/plugin/${p.slug ?? p.short_id}`}>
                  <Card className="relative p-4 h-full overflow-hidden border-orange-500/20 bg-gradient-to-br from-card via-card to-orange-500/5 hover:border-orange-500/60 hover:shadow-[0_0_30px_-8px_hsl(24_95%_53%/0.35)] transition group">
                    <div className="absolute top-0 left-0 h-full w-1 bg-gradient-to-b from-orange-400 via-orange-500 to-rose-600 opacity-70 group-hover:opacity-100 transition" />
                    <div className="flex gap-3 items-start pl-2">
                      {p.icon_url ? (
                        <img src={p.icon_url} alt="" className="h-12 w-12 rounded-md border border-orange-500/30 object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                          <Puzzle className="h-6 w-6 text-orange-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-semibold group-hover:text-orange-300 transition truncate">{p.name}</div>
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

        {/* Trending */}
        {trending.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-5 w-1 rounded-full bg-gradient-to-b from-rose-500 to-orange-400" />
                <TrendingUp className="h-4 w-4 text-rose-400" />
                <h2 className="font-display font-bold text-sm uppercase tracking-wider">Trending · 7d</h2>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Most downloaded</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {trending.map((p, i) => (
                <Link key={p.id} to={`/plugin/${p.slug ?? p.short_id}`}>
                  <Card className="relative p-4 h-full overflow-hidden border-rose-500/20 hover:border-rose-500/60 hover:shadow-[0_0_25px_-10px_hsl(346_87%_50%/0.5)] transition group">
                    <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-rose-500/10 blur-2xl" />
                    <div className="relative flex gap-3">
                      <div className="flex flex-col items-center justify-center w-8">
                        <span className="font-display font-black text-2xl bg-gradient-to-br from-rose-400 to-orange-400 bg-clip-text text-transparent">{i + 1}</span>
                      </div>
                      {p.icon_url ? (
                        <img src={p.icon_url} alt="" className="h-12 w-12 rounded-md object-cover border border-border shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                          <Puzzle className="h-6 w-6 text-rose-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-semibold group-hover:text-rose-300 transition truncate">{p.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-rose-300"><Download className="h-3 w-3" /> {fmt(downloads[p.id]?.last_7d ?? 0)} this week</span>
                          <span>·</span>
                          <span>{fmt(downloads[p.id]?.total ?? 0)} total</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Controls bar */}
        <div className="rounded-xl border border-border/70 bg-card/60 p-3 mb-3 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins, authors, tags..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-10 bg-background/70"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-10 bg-background/70 border border-border rounded-md px-3 text-sm text-foreground"
            >
              <option value="featured">Featured first</option>
              <option value="downloads">Most downloaded</option>
              <option value="updated">Recently updated</option>
              <option value="name">Name (A–Z)</option>
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground mr-1">
              <Filter className="h-3 w-3 text-orange-400" /> Filter
            </div>
            {CATEGORIES.map((c) => {
              const active = activeCats.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleCat(c)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                    active
                      ? "border-orange-500/60 bg-orange-500/15 text-orange-200"
                      : "border-border/60 text-muted-foreground hover:text-foreground hover:border-orange-500/40"
                  }`}
                >
                  {c}
                </button>
              );
            })}
            {activeCats.length > 0 && (
              <button
                onClick={() => setActiveCats([])}
                className="text-[11px] px-2 py-1 rounded-full text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            {loading ? "Loading…" : `${filtered.length} plugin${filtered.length === 1 ? "" : "s"}`}
            {q && <> · query "<span className="text-foreground/80">{q}</span>"</>}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <p className="text-center text-muted-foreground py-12">Loading plugins...</p>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Puzzle className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No plugins match your filters.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((p) => {
              const basePlatforms = p.platforms && p.platforms.length ? p.platforms : p.platform ? [p.platform] : [];
              const platforms = [...basePlatforms, ...p.tags.filter((t) => PLATFORM_COLORS[t.toLowerCase()])]
                .filter(Boolean)
                .filter((v, i, a) => a.findIndex((x) => x?.toLowerCase() === v?.toLowerCase()) === i) as string[];
              const creator = p.user_id ? creators[p.user_id] : undefined;
              const username = creator?.display_name || creator?.mc_username || p.author;

              return (
                <Link key={p.id} to={`/plugin/${p.slug ?? p.short_id}`}>
                  <Card className="relative p-4 h-full overflow-hidden hover:border-orange-500/50 hover:shadow-[0_0_25px_-10px_hsl(24_95%_53%/0.4)] transition group">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition" />
                    <div className="flex gap-3">
                      {p.icon_url ? (
                        <img
                          src={p.icon_url}
                          alt=""
                          className="h-14 w-14 rounded-md object-cover border border-border group-hover:border-orange-500/40 shrink-0 transition"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0">
                          <Puzzle className="h-7 w-7 text-orange-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-semibold group-hover:text-orange-300 transition truncate">
                            {p.name}
                          </h3>
                          {p.featured && <Sparkles className="h-3.5 w-3.5 text-orange-400 shrink-0" />}
                          {supportsFolia(platforms, p.tags) && <FoliaBadge />}
                        </div>
                        {username && (
                          <div className="text-xs text-muted-foreground truncate">
                            by <span className="text-foreground/80">{username}</span>
                            {p.version && <span className="ml-1.5 font-mono opacity-70">v{p.version}</span>}
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
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2 font-mono">
                          <span className="inline-flex items-center gap-1">
                            <Download className="h-3 w-3" /> {fmt(downloads[p.id]?.total ?? 0)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {fmt(favorites[p.id] ?? 0)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(p.updated_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Plugins;
