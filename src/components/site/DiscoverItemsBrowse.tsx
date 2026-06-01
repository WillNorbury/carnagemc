import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Download, Search, Sparkles, Clock, ChevronUp, ExternalLink } from "lucide-react";

type DiscoverItem = {
  id: string;
  kind: string;
  name: string;
  slug: string | null;
  description: string | null;
  author: string | null;
  version: string | null;
  icon_url: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
  download_url: string | null;
  external_url: string | null;
  created_at: string;
  updated_at: string;
};

const DISCOVER_TABS = [
  { label: "Mods", to: "/discover/mods" },
  { label: "Resource Packs", to: "/discover/resource-packs" },
  { label: "Data Packs", to: "/discover/data-packs" },
  { label: "Shaders", to: "/discover/shaders" },
  { label: "Modpacks", to: "/discover/modpacks" },
  { label: "Plugins", to: "/discover/plugins" },
  { label: "Servers", to: "/discover/servers" },
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

const FilterSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3 font-semibold text-sm"
      >
        {title}
        <ChevronUp
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>
      {open && <div className="px-3 pb-3 space-y-1.5">{children}</div>}
    </div>
  );
};

type FilterGroup = { title: string; options: string[] };

type Props = {
  kind: string;
  title: string;
  searchPlaceholder: string;
  /** Predefined filter groups for categories (matched against item.category and item.tags) */
  filterGroups?: FilterGroup[];
};

const DiscoverItemsBrowse = ({
  kind,
  title,
  searchPlaceholder,
  filterGroups = [],
}: Props) => {
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("relevance");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    document.title = `${title} — XyloMC`;
  }, [title]);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data } = await (supabase.from("discover_items" as any) as any)
        .select(
          "id, kind, name, slug, description, author, version, icon_url, category, tags, featured, download_url, external_url, created_at, updated_at",
        )
        .eq("kind", kind)
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      setItems((data ?? []) as DiscoverItem[]);
      setLoading(false);
    })();
  }, [kind]);

  const toggle = (group: string, value: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[group] ?? []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      next[group] = set;
      return next;
    });
    setPage(1);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = items.filter((it) => {
      for (const grp of filterGroups) {
        const sel = selected[grp.title];
        if (sel && sel.size > 0) {
          const haystack = [
            (it.category ?? "").toLowerCase(),
            ...it.tags.map((t) => t.toLowerCase()),
          ];
          const match = [...sel].some((v) =>
            haystack.includes(v.toLowerCase()),
          );
          if (!match) return false;
        }
      }
      if (!s) return true;
      return (
        it.name.toLowerCase().includes(s) ||
        (it.description ?? "").toLowerCase().includes(s) ||
        (it.author ?? "").toLowerCase().includes(s) ||
        (it.category ?? "").toLowerCase().includes(s) ||
        it.tags.some((t) => t.toLowerCase().includes(s))
      );
    });

    if (sort === "newest") {
      list = [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else if (sort === "updated") {
      list = [...list].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      );
    } else if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [items, q, sort, selected, filterGroups]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getUrl = (it: DiscoverItem) => it.download_url || it.external_url || null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoader loading={loading} label={`Loading ${title.toLowerCase()}`} />
      <Navbar />
      <main className="container pt-24 pb-16">
        <div className="flex justify-center mb-6">
          <div className="inline-flex flex-wrap gap-1 p-1 rounded-full border border-border bg-card/60">
            {DISCOVER_TABS.map((t) => (
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
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="space-y-4">
            {filterGroups.map((grp) => (
              <FilterSection key={grp.title} title={grp.title}>
                <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5">
                  {grp.options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary"
                    >
                      <Checkbox
                        checked={selected[grp.title]?.has(opt) ?? false}
                        onCheckedChange={() => toggle(grp.title, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </FilterSection>
            ))}
          </aside>

          <section className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
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
              <div className="text-xs text-muted-foreground">
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
              </div>
            </div>

            {!loading && pageItems.length === 0 ? (
              <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
                Nothing here yet. Check back soon!
              </div>
            ) : (
              <div className="space-y-3">
                {pageItems.map((it) => {
                  const url = getUrl(it);
                  const isExternal = !it.download_url && !!it.external_url;
                  return (
                    <div
                      key={it.id}
                      className="rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-elegant transition group"
                    >
                      <div className="flex items-stretch gap-4 p-4">
                        <div className="shrink-0">
                          {it.icon_url ? (
                            <img
                              src={it.icon_url}
                              alt=""
                              className="h-20 w-20 rounded-md object-cover border border-border"
                            />
                          ) : (
                            <div className="h-20 w-20 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                              <Package className="h-10 w-10 text-primary" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="font-display font-bold text-lg group-hover:text-primary transition">
                              {it.name}
                            </span>
                            {it.author && (
                              <span className="text-sm text-muted-foreground">
                                by <span className="text-foreground/80">{it.author}</span>
                              </span>
                            )}
                            {it.featured && <Sparkles className="h-4 w-4 text-primary" />}
                          </div>
                          {it.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {it.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {it.version && (
                              <Badge variant="outline" className="font-normal">
                                v{it.version}
                              </Badge>
                            )}
                            {it.category && (
                              <Badge variant="secondary" className="font-normal">
                                {it.category}
                              </Badge>
                            )}
                            {it.tags.slice(0, 4).map((t) => (
                              <Badge key={t} variant="outline" className="text-xs font-normal">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="hidden md:flex flex-col items-end justify-between text-xs text-muted-foreground shrink-0 min-w-[140px]">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {timeAgo(it.updated_at)}
                          </div>
                          {url ? (
                            <Button asChild size="sm" className="mt-2">
                              <a href={url} target="_blank" rel="noopener noreferrer">
                                {isExternal ? (
                                  <>
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Visit
                                  </>
                                ) : (
                                  <>
                                    <Download className="h-3.5 w-3.5 mr-1" /> Download
                                  </>
                                )}
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
                  .filter(
                    (p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1),
                  )
                  .map((p, i, arr) => (
                    <span key={p} className="flex items-center">
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="px-2 text-muted-foreground">…</span>
                      )}
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

export default DiscoverItemsBrowse;
