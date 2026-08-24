import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { SEO } from "@/components/site/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Trophy } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  player_name: string;
  tier: string;
  category: string;
  region: string | null;
  points: number;
  notes: string | null;
  sort_order: number;
};

const TIER_ORDER = [
  "HT5", "HT4", "HT3", "HT2", "HT1",
  "LT5", "LT4", "LT3", "LT2", "LT1",
  "X",
];

const tierStyle = (tier: string) => {
  const t = tier.toUpperCase();
  if (t === "X" || !t) {
    return "from-muted/40 to-muted/5 border-border text-muted-foreground";
  }
  if (t.startsWith("HT")) {
    const n = parseInt(t.slice(2), 10);
    // HT5 = best (primary/crimson), fading toward amber
    if (n >= 5) return "from-primary/30 to-primary/5 border-primary/40 text-primary";
    if (n === 4) return "from-orange-500/25 to-orange-500/5 border-orange-500/30 text-orange-400";
    if (n === 3) return "from-amber-400/20 to-amber-400/5 border-amber-400/30 text-amber-300";
    if (n === 2) return "from-sky-400/20 to-sky-400/5 border-sky-400/30 text-sky-300";
    return "from-sky-400/15 to-sky-400/5 border-sky-400/25 text-sky-300";
  }
  if (t.startsWith("LT")) {
    const n = parseInt(t.slice(2), 10);
    if (n >= 4) return "from-muted/40 to-muted/5 border-border text-muted-foreground";
    if (n === 3) return "from-muted/30 to-muted/5 border-border text-muted-foreground";
    return "from-muted/20 to-muted/5 border-border text-muted-foreground";
  }
  return "from-muted/40 to-muted/5 border-border text-muted-foreground";
};

const Tiers = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("player_tiers")
        .select("id,player_name,tier,category,region,points,notes,sort_order")
        .order("sort_order", { ascending: true });
      if (error) toast.error(error.message);
      else setRows((data ?? []) as Row[]);
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(rows.map((r) => r.category))).sort()],
    [rows]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (category === "All" || r.category === category) &&
        (!q || r.player_name.toLowerCase().includes(q) || (r.region ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, category]);

  const grouped = useMemo(() => {
    const norm = (t: string) => {
      const u = t.toUpperCase();
      return u ? u : "X";
    };
    const tiers = Array.from(new Set([...TIER_ORDER, ...filtered.map((r) => norm(r.tier))]));
    return tiers
      .map((t) => ({ tier: t, players: filtered.filter((r) => norm(r.tier) === t) }))
      .filter((g) => g.players.length > 0);
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Player Tier List | CarnageMC"
        description="Official CarnageMC player tier list — see how our top players rank across kits and gamemodes."
      />
      <Navbar />

      <main className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="relative container mx-auto px-4 py-14">
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-widest text-primary">
              <Trophy className="h-3.5 w-3.5" /> Rankings
            </div>
            <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">Player Tier List</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Staff-curated rankings of CarnageMC's strongest players. Tiers are reviewed regularly.
            </p>
          </header>

          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search players…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={category === c ? "default" : "outline"}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading tiers…
            </div>
          ) : grouped.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/40 p-10 text-center text-muted-foreground">
              No players have been ranked yet. Check back soon.
            </div>
          ) : (
            <div className="space-y-5">
              {grouped.map((g) => (
                <section
                  key={g.tier}
                  className={`rounded-2xl border bg-gradient-to-r ${tierStyle(g.tier)} backdrop-blur-sm`}
                >
                  <div className="flex flex-col gap-4 p-5 md:flex-row">
                    <div className="flex md:w-28 shrink-0 items-center justify-center">
                      <span className="text-5xl font-black leading-none">{g.tier}</span>
                    </div>
                    <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {g.players.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/70 p-3"
                        >
                          <img
                            src={`https://mc-heads.net/avatar/${encodeURIComponent(p.player_name)}/40`}
                            alt={`${p.player_name} Minecraft avatar`}
                            className="h-10 w-10 rounded-md"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-foreground">{p.player_name}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {p.category}
                              {p.region ? ` · ${p.region}` : ""}
                              {p.points ? ` · ${p.points} pts` : ""}
                            </div>
                            {p.notes && (
                              <div className="truncate text-xs text-muted-foreground/80">{p.notes}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Tiers;
