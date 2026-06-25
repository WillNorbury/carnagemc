import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Puzzle, Search, Sparkles, Download, Heart, Clock, ChevronDown } from "lucide-react";

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
  price: number | null;
  updated_at: string;
};


type CreatorProfile = { display_name: string | null; mc_username: string | null };

const DISCOVER_TABS = [
  { label: "Mods", to: "/discover/mods", enabled: true },
  { label: "Resource Packs", to: "/discover/resource-packs", enabled: true },
  { label: "Data Packs", to: "/discover/data-packs", enabled: true },
  { label: "Shaders", to: "/discover/shaders", enabled: true },
  { label: "Modpacks", to: "/discover/modpacks", enabled: true },
  { label: "Plugins", to: "/discover/plugins", enabled: true },
  { label: "Servers", to: "/discover/servers", enabled: true },
];

const CATEGORIES = [
  "Adventure", "Cursed", "Decoration", "Economy", "Equipment", "Food",
  "Game Mechanics", "Library", "Magic", "Management", "Minigame", "Mobs",
  "Optimization", "Social", "Storage", "Technology", "Transportation",
  "Utility", "World Generation",
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
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? "" : "s"} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? "" : "s"} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? "" : "s"} ago`;
};

const Plugins = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [creators, setCreators] = useState<Record<string, CreatorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [activePricing, setActivePricing] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"relevance" | "downloads" | "updated" | "newest">("relevance");

  useEffect(() => {
    document.title = "Plugins — CarnageMC";
    (async () => {
      const { data } = await supabase
        .from("plugins")
        .select("id, short_id, slug, name, description, version, author, user_id, icon_url, category, tags, platform, platforms, mc_versions, featured, price, updated_at")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
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
      if (activePricing.length > 0) {
        const isFree = !p.price || Number(p.price) === 0;
        const wantsFree = activePricing.includes("Free");
        const wantsPaid = activePricing.includes("Paid");
        if (!(wantsFree && wantsPaid)) {
          if (wantsFree && !isFree) return false;
          if (wantsPaid && isFree) return false;
        }
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
    } else if (sortBy === "newest") {
      res = [...res].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    return res;
  }, [plugins, q, activeCats, activePricing, sortBy]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16">
        {/* Discover tabs */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-wrap gap-1 p-1 rounded-full border border-border bg-card/60">
            {DISCOVER_TABS.map((t) =>
              t.enabled ? (
                <NavLink
                  key={t.label}
                  to={t.to}
                  end
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/40"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              ) : (
                <span
                  key={t.label}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground/40 cursor-not-allowed"
                  title="Coming soon"
                >
                  {t.label}
                </span>
              ),
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">Category</h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
              <ul className="space-y-1.5">
                {CATEGORIES.map((c) => {
                  const active = activeCats.includes(c);
                  return (
                    <li key={c}>
                      <button
                        onClick={() => toggleCat(c)}
                        className={`w-full text-left text-sm px-2 py-1 rounded transition flex items-center gap-2 ${
                          active
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        <Puzzle className="h-3.5 w-3.5 opacity-70" />
                        {c}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {activeCats.length > 0 && (
                <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={() => setActiveCats([])}>
                  Clear filters
                </Button>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-display font-semibold mb-3">Pricing</h3>
              <ul className="space-y-1.5">
                {["Free", "Paid"].map((opt) => {
                  const active = activePricing.includes(opt);
                  return (
                    <li key={opt}>
                      <button
                        onClick={() =>
                          setActivePricing((prev) =>
                            prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
                          )
                        }
                        className={`w-full text-left text-sm px-2 py-1 rounded transition ${
                          active
                            ? "text-primary bg-primary/10"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        }`}
                      >
                        {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </aside>

          {/* Main list */}
          <section>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 h-11"
              />
            </div>

            <div className="flex items-center justify-between mb-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-card border border-border rounded-md px-2 py-1 text-foreground"
                >
                  <option value="relevance">Relevance</option>
                  <option value="updated">Recently updated</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <div className="text-muted-foreground">
                {loading ? "Loading…" : `${filtered.length} plugin${filtered.length === 1 ? "" : "s"}`}
              </div>
            </div>

            {loading ? (
              <p className="text-center text-muted-foreground py-12">Loading plugins...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">No plugins found.</p>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => {
                  const basePlatforms = p.platforms && p.platforms.length ? p.platforms : p.platform ? [p.platform] : [];
                  const platforms = [...basePlatforms, ...p.tags.filter((t) => PLATFORM_COLORS[t.toLowerCase()])]
                    .filter(Boolean)
                    .filter((v, i, a) => a.findIndex((x) => x?.toLowerCase() === v?.toLowerCase()) === i) as string[];
                  const mcVersions = p.mc_versions ?? [];
                  const otherTags = p.tags.filter((t) => !PLATFORM_COLORS[t.toLowerCase()]);

                  return (
                    <Link key={p.id} to={`/plugin/${p.slug ?? p.short_id}`}>
                      <Card className="p-4 hover:border-primary/50 hover:shadow-elegant transition group">
                        <div className="flex gap-4">
                          {p.icon_url ? (
                            <img
                              src={p.icon_url}
                              alt=""
                              className="h-20 w-20 rounded-md object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                              <Puzzle className="h-9 w-9 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-display font-semibold text-lg group-hover:text-primary transition truncate">
                                    {p.name}
                                  </h3>
                                  {(() => {
                                    const creator = p.user_id ? creators[p.user_id] : undefined;
                                    const username = creator?.display_name || creator?.mc_username;
                                    const label = username ?? p.author;
                                    if (!label) return null;
                                    return (
                                      <span className="text-sm text-muted-foreground">
                                        by{" "}
                                        {username && p.user_id ? (
                                          <Link
                                            to={`/user/${username}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-foreground/80 hover:text-primary transition"
                                          >
                                            {username}
                                          </Link>
                                        ) : (
                                          <span className="text-foreground/80">{label}</span>
                                        )}
                                      </span>
                                    );
                                  })()}
                                  {p.featured && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                                </div>
                                {p.description && (
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                    {p.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                  {p.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {p.category}
                                    </Badge>
                                  )}
                                  {otherTags.slice(0, 4).map((t) => (
                                    <Badge key={t} variant="outline" className="text-xs">
                                      {t}
                                    </Badge>
                                  ))}
                                  {platforms.slice(0, 5).map((pl) => (
                                    <Badge
                                      key={pl}
                                      variant="outline"
                                      className={`text-xs ${PLATFORM_COLORS[pl.toLowerCase()] ?? ""}`}
                                    >
                                      {pl}
                                    </Badge>
                                  ))}
                                  {mcVersions.slice(0, 4).map((v) => (
                                    <Badge key={`mc-${v}`} variant="outline" className="text-xs">
                                      MC {v}
                                    </Badge>
                                  ))}

                                </div>
                              </div>
                              <div className="shrink-0 text-right text-sm space-y-1">
                                <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                                  <Download className="h-3.5 w-3.5" />
                                  <span className="text-foreground/80">—</span>
                                </div>
                                <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                                  <Heart className="h-3.5 w-3.5" />
                                  <span className="text-foreground/80">—</span>
                                </div>
                                <div className="flex items-center justify-end gap-1.5 text-muted-foreground text-xs">
                                  <Clock className="h-3 w-3" />
                                  {timeAgo(p.updated_at)}
                                </div>
                              </div>
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
