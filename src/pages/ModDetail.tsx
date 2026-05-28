import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Boxes, Download, Sparkles } from "lucide-react";

type Mod = {
  id: string;
  slug: string;
  short_id: string;
  name: string;
  description: string | null;
  long_description: string | null;
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

const ModDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [mod, setMod] = useState<Mod | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("mods" as any) as any)
        .select("id, slug, short_id, name, description, long_description, version, mc_version, loader, author, icon_url, category, tags, featured, jar_path, jar_filename, jar_size, download_url, published")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (!data) setNotFound(true);
      else {
        setMod(data as Mod);
        document.title = `${(data as Mod).name} — XyloMC Mod`;
      }
      setLoading(false);
    })();
  }, [slug]);

  const url = mod
    ? mod.download_url
      ? mod.download_url
      : mod.jar_path
        ? supabase.storage.from("mod-jars").getPublicUrl(mod.jar_path).data.publicUrl
        : null
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoader loading={loading} label="Loading mod" />
      <Navbar />
      <main className="container pt-28 pb-16 max-w-4xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/discover/mods"><ArrowLeft className="h-4 w-4 mr-1" /> Back to mods</Link>
        </Button>

        {notFound && !loading && (
          <Card className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Mod not found</h1>
            <p className="text-muted-foreground">The mod you're looking for doesn't exist or isn't published.</p>
          </Card>
        )}

        {mod && (
          <>
            <Card className="p-6 md:p-8">
              <div className="flex items-start gap-5 mb-6">
                {mod.icon_url ? (
                  <img src={mod.icon_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-border shrink-0" />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <Boxes className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl md:text-4xl font-display font-bold">{mod.name}</h1>
                    {mod.featured && <Sparkles className="h-5 w-5 text-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">#{mod.short_id}</div>
                  {mod.author && <p className="text-sm text-muted-foreground mt-1">by {mod.author}</p>}
                </div>
                {url ? (
                  <Button asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </a>
                  </Button>
                ) : (
                  <Button disabled>Unavailable</Button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {mod.loader && <Badge variant="secondary">{mod.loader}</Badge>}
                {mod.mc_version && <Badge variant="outline">MC {mod.mc_version}</Badge>}
                {mod.version && <Badge variant="outline">v{mod.version}</Badge>}
                {mod.category && <Badge variant="outline">{mod.category}</Badge>}
                {mod.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>

              {mod.description && (
                <p className="text-muted-foreground mb-6">{mod.description}</p>
              )}

              {mod.long_description && (
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                  {mod.long_description}
                </div>
              )}

              {mod.jar_filename && (
                <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
                  File: <span className="font-mono">{mod.jar_filename}</span>
                  {mod.jar_size ? ` · ${formatSize(mod.jar_size)}` : ""}
                </div>
              )}
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ModDetail;
