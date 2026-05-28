import { useEffect, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Boxes, Download, Search, Sparkles } from "lucide-react";

type Mod = {
  id: string;
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
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const Mods = () => {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    document.title = "Mods — XyloMC";
    (async () => {
      const { data } = await (supabase.from("mods" as any) as any)
        .select("id, short_id, name, description, version, mc_version, loader, author, icon_url, category, tags, featured, jar_path, jar_filename, jar_size, download_url")
        .eq("published", true)
        .order("featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      setMods((data ?? []) as Mod[]);
      setLoading(false);
    })();
  }, []);

  const getDownloadUrl = (m: Mod) => {
    if (m.download_url) return m.download_url;
    if (m.jar_path) {
      const { data } = supabase.storage.from("mod-jars").getPublicUrl(m.jar_path);
      return data.publicUrl;
    }
    return null;
  };

  const filtered = mods.filter((m) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      m.name.toLowerCase().includes(s) ||
      (m.description ?? "").toLowerCase().includes(s) ||
      (m.author ?? "").toLowerCase().includes(s) ||
      (m.loader ?? "").toLowerCase().includes(s) ||
      (m.category ?? "").toLowerCase().includes(s) ||
      m.tags.some((t) => t.toLowerCase().includes(s))
    );
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoader loading={loading} label="Loading mods" />
      <Navbar />
      <main className="container pt-28 pb-16">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs uppercase tracking-wider text-primary mb-4">
            <Boxes className="h-3.5 w-3.5" /> Mod Library
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            XyloMC <span className="text-gradient">Mods</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Download official client-side mods curated for our server. Compatible with Forge and Fabric.
          </p>
        </header>

        <div className="max-w-md mx-auto mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search mods..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        {!loading && filtered.length === 0 ? (
          <p className="text-center text-muted-foreground">No mods found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => {
              const url = getDownloadUrl(m);
              return (
                <Card key={m.id} className="p-5 h-full flex flex-col hover:border-primary/50 hover:shadow-elegant transition group">
                  <div className="flex items-start gap-3 mb-3">
                    {m.icon_url ? (
                      <img src={m.icon_url} alt="" className="h-12 w-12 rounded-md object-cover border border-border" />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                        <Boxes className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold truncate group-hover:text-primary transition">{m.name}</h3>
                        {m.featured && <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">#{m.short_id}</div>
                    </div>
                  </div>
                  {m.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{m.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {m.loader && <Badge variant="secondary">{m.loader}</Badge>}
                    {m.mc_version && <Badge variant="outline">MC {m.mc_version}</Badge>}
                    {m.version && <Badge variant="outline">v{m.version}</Badge>}
                    {m.category && <Badge variant="outline">{m.category}</Badge>}
                    {m.tags.slice(0, 3).map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate">
                      {m.jar_filename ?? (m.author ? `by ${m.author}` : "")}
                      {m.jar_size ? ` · ${formatSize(m.jar_size)}` : ""}
                    </span>
                    {url ? (
                      <Button asChild size="sm">
                        <a href={url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </a>
                      </Button>
                    ) : (
                      <Button size="sm" disabled>Unavailable</Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Mods;
