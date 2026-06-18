import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Wrench, Bug, Zap, ShieldCheck, Plus } from "lucide-react";

type Entry = {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string | null;
  entry_date: string;
};

const CATEGORIES: { key: string; label: string; icon: any; cls: string }[] = [
  { key: "feature", label: "Feature", icon: Sparkles, cls: "text-primary border-primary/40" },
  { key: "update", label: "Update", icon: Zap, cls: "text-accent border-accent/40" },
  { key: "fix", label: "Bug Fix", icon: Bug, cls: "text-orange-400 border-orange-400/40" },
  { key: "balance", label: "Balance", icon: Wrench, cls: "text-blue-400 border-blue-400/40" },
  { key: "security", label: "Security", icon: ShieldCheck, cls: "text-emerald-400 border-emerald-400/40" },
  { key: "addition", label: "Addition", icon: Plus, cls: "text-purple-400 border-purple-400/40" },
];

const catMeta = (key: string) =>
  CATEGORIES.find((c) => c.key === key) ?? { key, label: key, icon: Zap, cls: "text-muted-foreground border-border" };

const Changelog = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    document.title = "Changelog — CarnageMC";
    supabase
      .from("changelog_entries")
      .select("id,title,content,category,version,entry_date")
      .eq("published", true)
      .order("entry_date", { ascending: false })
      .then(({ data }) => {
        setEntries((data as Entry[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? entries : entries.filter((e) => e.category === filter)),
    [entries, filter]
  );

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    filtered.forEach((e) => {
      const k = e.entry_date;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(e);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-10">
          <div className="absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
              <Zap className="h-3 w-3 mr-1" /> Server Updates
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">
              Change<span className="text-gradient">log</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every patch, fix, and feature shipped to CarnageMC.
            </p>
          </div>
        </section>

        <div className="container pb-20 max-w-4xl">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            <Button
              size="sm"
              variant={filter === "all" ? "default" : "outline"}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <Button
                  key={c.key}
                  size="sm"
                  variant={filter === c.key ? "default" : "outline"}
                  onClick={() => setFilter(c.key)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {c.label}
                </Button>
              );
            })}
          </div>

          {loading ? (
            <p className="text-muted-foreground text-center">Loading…</p>
          ) : grouped.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">No changelog entries yet.</p>
            </Card>
          ) : (
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-3 md:left-4 top-0 bottom-0 w-px bg-border/60" />
              <div className="space-y-10">
                {grouped.map(([date, items]) => (
                  <div key={date} className="relative pl-10 md:pl-14">
                    <div className="absolute left-0 top-1.5 h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                    </div>
                    <div className="text-xs uppercase tracking-[0.25em] text-primary mb-3 font-display">
                      {new Date(date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="space-y-3">
                      {items.map((e) => {
                        const meta = catMeta(e.category);
                        const Icon = meta.icon;
                        return (
                          <Card key={e.id} className="p-5 hover:border-primary/40 transition">
                            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Badge variant="outline" className={meta.cls}>
                                  <Icon className="h-3 w-3 mr-1" />
                                  {meta.label}
                                </Badge>
                                {e.version && (
                                  <Badge variant="secondary" className="font-mono">
                                    v{e.version}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <h3 className="font-display font-bold text-lg mb-1">{e.title}</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{e.content}</p>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Changelog;
