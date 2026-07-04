import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, ExternalLink, Search, X } from "lucide-react";

const LOADERS = ["paper", "spigot", "bukkit", "purpur", "folia", "velocity", "waterfall", "bungeecord", "sponge"];


type ModrinthHit = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  downloads: number;
  follows: number;
  icon_url: string | null;
  author: string;
  latest_version?: string;
  date_modified: string;
};

type SearchResp = {
  hits: ModrinthHit[];
  offset: number;
  limit: number;
  total_hits: number;
};

const PAGE_SIZE = 24;

export default function ModrinthPlugins() {
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [loader, setLoader] = useState<string>("any");
  const [mcVersion, setMcVersion] = useState<string>("any");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SearchResp | null>(null);
  const [gameVersions, setGameVersions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Modrinth Plugins — CarnageMC";
  }, []);

  // Load MC game versions (releases only)
  useEffect(() => {
    fetch("https://api.modrinth.com/v2/tag/game_version")
      .then((r) => r.json())
      .then((v: Array<{ version: string; version_type: string }>) => {
        setGameVersions(v.filter((g) => g.version_type === "release").map((g) => g.version));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const facets: string[][] = [["project_type:plugin"]];
    if (loader !== "any") facets.push([`categories:${loader}`]);
    if (mcVersion !== "any") facets.push([`versions:${mcVersion}`]);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
      index: "relevance",
      facets: JSON.stringify(facets),
    });
    if (query.trim()) params.set("query", query.trim());
    fetch(`https://api.modrinth.com/v2/search?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Modrinth API ${r.status}`);
        return r.json();
      })
      .then((json: SearchResp) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, page, loader, mcVersion]);

  const totalPages = useMemo(
    () => (data ? Math.ceil(Math.min(data.total_hits, 10000) / PAGE_SIZE) : 0),
    [data]
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Modrinth Plugins</h1>
        <p className="text-muted-foreground mt-2">
          Browse all Minecraft plugins from{" "}
          <a
            href="https://modrinth.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-foreground"
          >
            Modrinth
          </a>
          .
        </p>
      </header>

      <form
        className="flex gap-2 mb-6"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQuery(input);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search plugins (e.g. essentials, worldedit)"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Select
          value={loader}
          onValueChange={(v) => {
            setPage(0);
            setLoader(v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Loader" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any loader</SelectItem>
            {LOADERS.map((l) => (
              <SelectItem key={l} value={l} className="capitalize">
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={mcVersion}
          onValueChange={(v) => {
            setPage(0);
            setMcVersion(v);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="MC version" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="any">Any MC version</SelectItem>
            {gameVersions.map((g) => (
              <SelectItem key={g} value={g}>
                MC {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(loader !== "any" || mcVersion !== "any") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setLoader("any");
              setMcVersion("any");
              setPage(0);
            }}
          >
            <X className="h-4 w-4 mr-1" /> Clear filters
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading plugins…
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg border border-destructive/40 text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="text-sm text-muted-foreground mb-4">
            {data.total_hits.toLocaleString()} plugins
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.hits.map((p) => (
              <Card key={p.project_id} className="overflow-hidden hover:border-primary/40 transition">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {p.icon_url ? (
                      <img
                        src={p.icon_url}
                        alt={p.title}
                        loading="lazy"
                        className="h-14 w-14 rounded-md object-cover bg-muted flex-shrink-0"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-md bg-muted flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">by {p.author}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Download className="h-3 w-3" /> {p.downloads.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {p.categories.slice(0, 4).map((c) => (
                      <Badge key={c} variant="secondary" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button asChild size="sm" className="w-full">
                      <Link to={`/modrinth-plugins/${p.project_id}`}>
                        View details
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="w-full">
                      <a
                        href={`https://modrinth.com/plugin/${p.slug}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Modrinth <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Page {page + 1} of {totalPages.toLocaleString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
