import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Puzzle, Sparkles, User } from "lucide-react";

type Plugin = {
  id: string;
  short_id: string;
  name: string;
  description: string | null;
  long_description: string | null;
  version: string | null;
  author: string | null;
  download_url: string | null;
  icon_url: string | null;
  category: string | null;
  platform: string | null;
  tags: string[];
  featured: boolean;
  created_at: string;
  jar_filename: string | null;
  jar_size: number | null;
};

const formatBytes = (b: number | null) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

const buildJarName = (plugin: Plugin) => {
  const sanitize = (s: string | null) => (s ? s.replace(/\s+/g, "-") : "");
  const parts = [sanitize(plugin.name), sanitize(plugin.platform), sanitize(plugin.version)].filter(Boolean);
  return parts.length > 0 ? `${parts.join("-")}.jar` : `${sanitize(plugin.name) || "plugin"}.jar`;
};

const PluginDetail = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!shortId) return;
    (async () => {
      const { data } = await supabase
        .from("plugins")
        .select("*")
        .eq("short_id", shortId)
        .eq("published", true)
        .maybeSingle();
      if (!data) {
        setNotFound(true);
      } else {
        setPlugin(data as Plugin);
        document.title = `${data.name} — Plugin — ZyphoraMC`;
      }
      setLoading(false);
    })();
  }, [shortId]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-28 pb-16 max-w-4xl">
        <Link to="/plugins" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to plugins
        </Link>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : notFound || !plugin ? (
          <Card className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Plugin not found</h1>
            <p className="text-muted-foreground mb-6">This plugin doesn't exist or isn't published.</p>
            <Button asChild><Link to="/plugins">Browse plugins</Link></Button>
          </Card>
        ) : (
          <>
            <Card className="p-6 md:p-8 mb-6">
              <div className="flex items-start gap-5">
                {plugin.icon_url ? (
                  <img src={plugin.icon_url} alt="" className="h-20 w-20 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Puzzle className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-3xl font-display font-bold">{plugin.name}</h1>
                    {plugin.featured && (
                      <Badge className="gap-1"><Sparkles className="h-3 w-3" /> Featured</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono mt-1">#{plugin.short_id}</div>
                  <div className="flex items-center gap-3 mt-3 flex-wrap text-sm text-muted-foreground">
                    {plugin.author && (
                      <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {plugin.author}</span>
                    )}
                    {plugin.version && <Badge variant="outline">v{plugin.version}</Badge>}
                    {plugin.category && <Badge variant="secondary">{plugin.category}</Badge>}
                  </div>
                </div>
              </div>

              {plugin.description && (
                <p className="mt-6 text-muted-foreground">{plugin.description}</p>
              )}

              {plugin.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {plugin.tags.map((t) => (
                    <Badge key={t} variant="outline">{t}</Badge>
                  ))}
                </div>
              )}

              {plugin.download_url && (
                <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">
                      Download
                    </div>
                    <div className="text-sm font-mono truncate">
                      {buildJarName(plugin)}
                    </div>
                    {plugin.jar_size && (
                      <div className="text-xs text-muted-foreground">{formatBytes(plugin.jar_size)}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-center sm:items-end gap-1 shrink-0">
                    <Button asChild size="lg" className="glow">
                      <a
                        href={plugin.download_url}
                        target="_blank"
                        rel="noreferrer"
                        download={buildJarName(plugin)}
                      >
                        <Download className="h-5 w-5 mr-2" /> Download .jar
                      </a>
                    </Button>
                    <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">
                      {buildJarName(plugin)}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {plugin.long_description && (
              <Card className="p-6 md:p-8">
                <h2 className="font-display font-bold text-xl mb-3">About</h2>
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
                  {plugin.long_description}
                </div>
              </Card>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PluginDetail;
