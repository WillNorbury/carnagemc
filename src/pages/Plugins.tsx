import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Puzzle, Search, Sparkles } from "lucide-react";

type Plugin = {
  id: string;
  short_id: string;
  slug: string | null;

  name: string;
  description: string | null;
  version: string | null;
  author: string | null;
  icon_url: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
};

const Plugins = () => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "Plugins — XyloMC";
    (async () => {
      const { data } = await supabase
        .from("plugins")
        .select("id, short_id, slug, name, description, version, author, icon_url, category, tags, featured")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      setPlugins((data ?? []) as Plugin[]);
      setLoading(false);
    })();
  }, []);

  const filtered = plugins.filter((p) => {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-28 pb-16">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs uppercase tracking-wider text-primary mb-4">
            <Puzzle className="h-3.5 w-3.5" /> Plugin Library
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            XyloMC <span className="text-gradient">Plugins</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Explore the plugins powering our server. Click any plugin to see details.
          </p>
        </header>

        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search plugins..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading plugins...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground">No plugins found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link key={p.id} to={`/discover/plugins/${p.short_id}`}>
                <Card className="p-5 h-full hover:border-primary/50 hover:shadow-elegant transition group">
                  <div className="flex items-start gap-3 mb-3">
                    {p.icon_url ? (
                      <img src={p.icon_url} alt="" className="h-12 w-12 rounded-md object-cover border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Puzzle className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold truncate group-hover:text-primary transition">{p.name}</h3>
                        {p.featured && (
                          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">#{p.short_id}</div>
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {p.category && <Badge variant="secondary">{p.category}</Badge>}
                    {p.version && <Badge variant="outline">v{p.version}</Badge>}
                    {p.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Plugins;
