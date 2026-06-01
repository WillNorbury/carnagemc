import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Download,
  Flag,
  Heart,
  Link as LinkIcon,
  Monitor,
  MoreVertical,
  Package,
  Puzzle,
  User,
} from "lucide-react";

type Plugin = {
  id: string;
  short_id: string;
  slug: string | null;
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
  updated_at: string | null;
  jar_filename: string | null;
  jar_size: number | null;
  screenshots: string[];
};

const formatSize = (b: number | null) => {
  if (!b) return "";
  const kb = b / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const timeAgo = (iso: string | null) => {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)} minutes ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)} hours ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)} days ago`;
  const w = d / 7;
  if (w < 5) return `${Math.floor(w)} weeks ago`;
  const mo = d / 30;
  if (mo < 12) return `${Math.floor(mo)} months ago`;
  return `${Math.floor(d / 365)} years ago`;
};

const buildJarName = (plugin: Plugin) => {
  const sanitize = (s: string | null) => (s ? s.replace(/\s+/g, "-") : "");
  const parts = [sanitize(plugin.name), sanitize(plugin.platform), sanitize(plugin.version)].filter(Boolean);
  return parts.length > 0 ? `${parts.join("-")}.jar` : `${sanitize(plugin.name) || "plugin"}.jar`;
};

const PLATFORM_LABELS: Record<string, string> = {
  bukkit: "Bukkit",
  spigot: "Spigot",
  paper: "Paper",
  folia: "Folia",
  purpur: "Purpur",
  velocity: "Velocity",
  bungee: "BungeeCord",
  bungeecord: "BungeeCord",
  waterfall: "Waterfall",
};

type Tab = "description" | "gallery" | "versions";

const PluginDetail = () => {
  const { slug, shortId } = useParams<{ slug?: string; shortId?: string }>();
  const key = slug ?? shortId;
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("description");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    (async () => {
      setLoading(true);
      let { data } = await supabase.from("plugins").select("*").eq("published", true).eq("slug", key).maybeSingle();
      if (!data) {
        const fb = await supabase.from("plugins").select("*").eq("published", true).eq("short_id", key).maybeSingle();
        data = fb.data;
      }
      if (!data) setNotFound(true);
      else {
        setPlugin(data as Plugin);
        document.title = `${(data as Plugin).name} — Plugin — XyloMC`;
      }
      setLoading(false);
    })();
  }, [key]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const platforms = (plugin?.platform || "")
    .split(/[,/|]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);

  const handleDownload = async () => {
    if (!plugin?.download_url) return;
    const filename = buildJarName(plugin);
    try {
      const res = await fetch(plugin.download_url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(plugin.download_url, "_blank", "noopener");
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "gallery", label: "Gallery" },
    { id: "versions", label: "Versions" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoader loading={loading} label="Loading plugin" />
      <Navbar />
      <main className="container pt-28 pb-16 max-w-6xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/discover/plugins">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to plugins
          </Link>
        </Button>

        {notFound && !loading && (
          <Card className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Plugin not found</h1>
            <p className="text-muted-foreground">
              The plugin you're looking for doesn't exist or isn't published.
            </p>
          </Card>
        )}

        {plugin && (
          <>
            {/* Header */}
            <div className="flex items-start gap-5 pb-6 border-b border-border">
              {plugin.icon_url ? (
                <img
                  src={plugin.icon_url}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover border border-border shrink-0 bg-card"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Puzzle className="h-12 w-12 text-primary" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">
                  {plugin.name}
                </h1>
                {plugin.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-2xl">
                    {plugin.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Download className="h-4 w-4" /> 0
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4" /> 0
                  </span>
                  {plugin.category && (
                    <Badge variant="secondary" className="rounded-full">
                      {plugin.category}
                    </Badge>
                  )}
                  {plugin.tags?.slice(0, 2).map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {plugin.download_url ? (
                  <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90 rounded-full px-5">
                    <Download className="h-4 w-4 mr-1.5" /> Download
                  </Button>
                ) : (
                  <Button disabled className="rounded-full px-5">Unavailable</Button>
                )}
                <Button
                  variant={liked ? "default" : "outline"}
                  size="icon"
                  className="rounded-full h-10 w-10"
                  aria-label="Like"
                  onClick={() => setLiked((v) => !v)}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                </Button>
                <Button
                  variant={saved ? "default" : "outline"}
                  size="icon"
                  className="rounded-full h-10 w-10"
                  aria-label="Save"
                  onClick={() => setSaved((v) => !v)}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-10 w-10" aria-label="More">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyLink}>
                      <LinkIcon className="h-4 w-4 mr-2" /> Copy link
                    </DropdownMenuItem>
                    {plugin.download_url && (
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" /> Download jar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => toast.success("Report submitted — thanks for letting us know")}
                      className="text-destructive focus:text-destructive"
                    >
                      <Flag className="h-4 w-4 mr-2" /> Report plugin
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Body: tabs + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-6">
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                        tab === t.id
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <Card className="p-6">
                  {tab === "description" && (
                    <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {plugin.long_description || plugin.description || (
                        <span className="text-muted-foreground">No description provided.</span>
                      )}
                    </div>
                  )}
                  {tab === "gallery" && (
                    plugin.screenshots?.length > 0 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {plugin.screenshots.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => setLightbox(url)}
                            className="block group text-left"
                          >
                            <img
                              src={url}
                              alt={`${plugin.name} screenshot`}
                              loading="lazy"
                              className="w-full rounded-lg border border-border object-cover aspect-video group-hover:border-primary/50 transition cursor-zoom-in"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No gallery images yet.</p>
                    )
                  )}
                  {tab === "versions" && (
                    <div className="space-y-2">
                      {plugin.download_url ? (
                        <div className="flex items-center justify-between p-3 rounded-md border border-border gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {plugin.jar_filename || buildJarName(plugin)}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                              {plugin.version && <span>v{plugin.version}</span>}
                              {plugin.platform && <span>· {plugin.platform}</span>}
                              {plugin.jar_size ? <span>· {formatSize(plugin.jar_size)}</span> : null}
                            </div>
                          </div>
                          <Button onClick={handleDownload} size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No versions available.</p>
                      )}
                    </div>
                  )}
                </Card>
              </div>

              {/* Sidebar */}
              <aside className="space-y-4">
                <Card className="p-5">
                  <h3 className="font-bold mb-3">Compatibility</h3>
                  {platforms.length > 0 && (
                    <>
                      <div className="text-sm font-semibold mb-1">Platforms</div>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {platforms.map((p) => (
                          <Badge key={p} variant="secondary" className="rounded-full">
                            <Package className="h-3 w-3 mr-1" />
                            {PLATFORM_LABELS[p] || p}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                  <div className="text-sm font-semibold mb-1">Supported environments</div>
                  <Badge variant="secondary" className="rounded-full">
                    <Monitor className="h-3 w-3 mr-1" />
                    Server-side
                  </Badge>
                </Card>

                {plugin.tags?.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-bold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {plugin.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="rounded-full">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {plugin.author && (
                  <Card className="p-5">
                    <h3 className="font-bold mb-3">Creators</h3>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{plugin.author}</div>
                        <div className="text-xs text-muted-foreground">Author</div>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-5">
                  <h3 className="font-bold mb-3">Details</h3>
                  <div className="space-y-2 text-sm">
                    {plugin.version && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" /> Version {plugin.version}
                      </div>
                    )}
                    {plugin.created_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" /> Published {timeAgo(plugin.created_at)}
                      </div>
                    )}
                    {plugin.updated_at && plugin.updated_at !== plugin.created_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" /> Updated {timeAgo(plugin.updated_at)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground/70 font-mono pt-1">
                      #{plugin.short_id}
                    </div>
                  </div>
                </Card>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PluginDetail;
