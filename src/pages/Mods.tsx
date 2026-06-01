import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Boxes, Download, Search, Sparkles, Clock, ChevronUp } from "lucide-react";

type Mod = {
  id: string;
  slug: string;
  short_id: string;
  name: string;
  description: string | null;
  version: string | null;
  mc_version: string | null;
  loader: string | null;
  author: string | null;
  icon_url: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
  jar_path: string | null;
  jar_filename: string | null;
  jar_size: number | null;
  download_url: string | null;
  created_at: string;
  updated_at: string;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const DISCOVER_TABS = [
  { label: "Mods", to: "/discover/mods", enabled: true },
  { label: "Resource Packs", to: "/discover/resource-packs", enabled: false },
  { label: "Data Packs", to: "/discover/data-packs", enabled: false },
  { label: "Shaders", to: "/discover/shaders", enabled: false },
  { label: "Modpacks", to: "/discover/modpacks", enabled: false },
  { label: "Plugins", to: "/discover/plugins", enabled: true },
  { label: "Servers", to: "/discover/servers", enabled: false },
];

const CATEGORIES = [
  "Adventure",
  "Cursed",
  "Decoration",
  "Economy",
  "Equipment",
  "Food",
  "Game Mechanics",
  "Library",
  "Magic",
  "Management",
  "Minigame",
  "Mobs",
  "Optimization",
  "Social",
  "Storage",
  "Technology",
  "Transportation",
  "Utility",
  "World Generation",
];

const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)} min ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)} hours ago`;
  const d = h / 24;
  if (d < 30) return `${Math.floor(d)} days ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)} months ago`;
  return `${Math.floor(d / 365)} years ago`;
};

type SortKey = "relevance" | "newest" | "updated" | "name";

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3 font-semibold text-sm"
      >
        {title}
        <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "" : "rotate-180"}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-1.5">{children}</div>}
    </div>
  );
};

const Mods = () => {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);

  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [selectedLoaders, setSelectedLoaders] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = "Mods — XyloMC";
    (async () => {
      const { data } = await (supabase.from("mods" as any) as any)
        .select(
          "id, slug, short_id, name, description, version, mc_version, loader, author, icon_url, category, tags, featured, jar_path, jar_filename, jar_size, download_url, created_at, updated_at, sort_order",
        )
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      setMods((data ?? []) as Mod[]);
      setLoading(false);
    })();
  }, []);

  const versions = useMemo(() => {
    const s = new Set<string>();
    mods.forEach((m) => m.mc_version && s.add(m.mc_version));
    return [...s].sort().reverse();
  }, [mods]);

  const loaders = useMemo(() => {
    const s = new Set<string>();
    mods.forEach((m) => m.loader && s.add(m.loader));
    return [...s].sort();
  }, [mods]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    mods.forEach((m) => m.category && s.add(m.category));
    return [...s].sort();
  }, [mods]);

  const getDownloadUrl = (m: Mod) => {
    if (m.download_url) return m.download_url;
    if (m.jar_path) {
      const { data } = supabase.storage.from("mod-jars").getPublicUrl(m.jar_path);
      return data.publicUrl;
    }
    return null;
  };

  const toggle = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = mods.filter((m) => {
      if (selectedVersions.size && !(m.mc_version && selectedVersions.has(m.mc_version))) return false;
      if (selectedLoaders.size && !(m.loader && selectedLoaders.has(m.loader))) return false;
      if (selectedCategories.size && !(m.category && selectedCategories.has(m.category))) return false;
      if (!s) return true;
      return (
        m.name.toLowerCase().includes(s) ||
        (m.description ?? "").toLowerCase().includes(s) ||
        (m.author ?? "").toLowerCase().includes(s) ||
        (m.loader ?? "").toLowerCase().includes(s) ||
        (m.category ?? "").toLowerCase().includes(s) ||
        m.tags.some((t) => t.toLowerCase().includes(s))
      );
    });

    if (sort === "newest") {
      list = [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "updated") {
      list = [...list].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [mods, q, sort, selectedVersions, selectedLoaders, selectedCategories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoader loading={loading} label="Loading mods" />
      <Navbar />
      <main className="container pt-24 pb-16">
        <div className="flex items-center gap-2 mb-6 text-sm font-semibold">
          <span className="px-3 py-1.5 rounded-full border border-primary/60 text-primary bg-primary/10 flex items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5" /> Mods
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar filters */}
          <aside className="space-y-4">
            <FilterSection title="Game version">
              <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5">
                {versions.length === 0 && <p className="text-xs text-muted-foreground">No versions yet</p>}
                {versions.map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                    <Checkbox
                      checked={selectedVersions.has(v)}
                      onCheckedChange={() => toggle(selectedVersions, v, setSelectedVersions)}
                    />
                    {v}
                  </label>
                ))}
              </div>
            </FilterSection>

            <FilterSection title="Loader">
              {loaders.length === 0 && <p className="text-xs text-muted-foreground">No loaders yet</p>}
              {loaders.map((l) => (
                <label key={l} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                  <Checkbox
                    checked={selectedLoaders.has(l)}
                    onCheckedChange={() => toggle(selectedLoaders, l, setSelectedLoaders)}
                  />
                  {l}
                </label>
              ))}
            </FilterSection>

            <FilterSection title="Category">
              {categories.length === 0 && <p className="text-xs text-muted-foreground">No categories yet</p>}
              {categories.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                  <Checkbox
                    checked={selectedCategories.has(c)}
                    onCheckedChange={() => toggle(selectedCategories, c, setSelectedCategories)}
                  />
                  {c}
                </label>
              ))}
            </FilterSection>
          </aside>

          {/* Main column */}
          <section className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mods..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-11 bg-card"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger className="w-[200px] bg-card">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Sort by: Relevance</SelectItem>
                    <SelectItem value="newest">Sort by: Newest</SelectItem>
                    <SelectItem value="updated">Sort by: Updated</SelectItem>
                    <SelectItem value="name">Sort by: Name</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(parseInt(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[120px] bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        View: {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </div>
            </div>

            {!loading && pageItems.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
                No mods found.
              </div>
            ) : (
              <div className="space-y-3">
                {pageItems.map((m) => {
                  const url = getDownloadUrl(m);
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-elegant transition group"
                    >
                      <div className="flex items-stretch gap-4 p-4">
                        <Link to={`/mod/${m.slug}`} className="shrink-0" aria-label={m.name}>
                          {m.icon_url ? (
                            <img
                              src={m.icon_url}
                              alt=""
                              className="h-20 w-20 rounded-md object-cover border border-border"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                              <Boxes className="h-10 w-10 text-primary" />
                            </div>
                          )}
                        </Link>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <Link
                              to={`/mod/${m.slug}`}
                              className="font-display font-bold text-lg group-hover:text-primary transition"
                            >
                              {m.name}
                            </Link>
                            {m.author && (
                              <span className="text-sm text-muted-foreground">
                                by <span className="text-foreground/80">{m.author}</span>
                              </span>
                            )}
                            {m.featured && <Sparkles className="h-4 w-4 text-primary" />}
                          </div>
                          {m.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{m.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {m.loader && (
                              <Badge variant="secondary" className="font-normal">
                                {m.loader}
                              </Badge>
                            )}
                            {m.mc_version && (
                              <Badge variant="outline" className="font-normal">
                                MC {m.mc_version}
                              </Badge>
                            )}
                            {m.version && (
                              <Badge variant="outline" className="font-normal">
                                v{m.version}
                              </Badge>
                            )}
                            {m.category && (
                              <Badge variant="outline" className="font-normal">
                                {m.category}
                              </Badge>
                            )}
                            {m.tags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="outline" className="text-xs font-normal">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-end justify-between text-xs text-muted-foreground shrink-0 min-w-[140px]">
                          <div className="flex items-center gap-1">
                            <Download className="h-3.5 w-3.5" />
                            {m.jar_size ? formatSize(m.jar_size) : "—"}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeAgo(m.updated_at)}
                          </div>
                          {url ? (
                            <Button asChild size="sm" className="mt-2">
                              <a href={url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-3.5 w-3.5 mr-1" /> Download
                              </a>
                            </Button>
                          ) : (
                            <Button size="sm" disabled className="mt-2">
                              Unavailable
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center">
                      {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-muted-foreground">…</span>}
                      <Button
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className="min-w-[36px]"
                      >
                        {p}
                      </Button>
                    </span>
                  ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Mods;
