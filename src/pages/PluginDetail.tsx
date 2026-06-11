import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Pencil } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Gamepad2, ChevronDown, Search, KeyRound, Info } from "lucide-react";
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
  platforms: string[] | null;
  mc_versions: string[] | null;
  tags: string[];
  featured: boolean;
  created_at: string;
  updated_at: string | null;
  jar_filename: string | null;
  jar_size: number | null;
  screenshots: string[];
  user_id: string | null;

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

const buildJarName = (plugin: Plugin, platform?: string | null) => {
  const sanitize = (s: string | null) => (s ? s.replace(/\s+/g, "-") : "");
  const plat = platform ?? plugin.platform;
  const parts = [sanitize(plugin.name), sanitize(plat), sanitize(plugin.version)].filter(Boolean);
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

const GAME_VERSIONS = [
  "1.21.11","1.21.10","1.21.9","1.21.8","1.21.7","1.21.6","1.21.5","1.21.4","1.21.3","1.21.2","1.21.1","1.21",
  "1.20.6","1.20.5","1.20.4","1.20.3","1.20.2","1.20.1","1.20",
  "1.19.4","1.19.3","1.19.2","1.19.1","1.19",
  "1.18.2","1.18.1","1.18","1.17.1","1.17","1.16.5","1.16.4","1.16.3","1.16.2","1.16.1","1.16",
];

type Tab = "description" | "gallery" | "versions";

type PluginVersion = {
  id: string;
  version: string;
  changelog: string | null;
  jar_filename: string | null;
  jar_size: number | null;
  download_url: string | null;
  jar_path: string | null;
  created_at: string;
};

const PluginDetail = () => {
  const { slug, shortId } = useParams<{ slug?: string; shortId?: string }>();
  const key = slug ?? shortId;
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [versions, setVersions] = useState<PluginVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("description");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);
  const [versionQuery, setVersionQuery] = useState("");
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [platformOpen, setPlatformOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

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
        document.title = `${(data as Plugin).name} — Plugin — HavocSMP`;
        const { data: vs } = await (supabase.from("plugin_versions" as any) as any)
          .select("*")
          .eq("plugin_id", (data as Plugin).id)
          .order("created_at", { ascending: false });
        setVersions((vs ?? []) as PluginVersion[]);
      }
      setLoading(false);
    })();
  }, [key]);

  const resolveVersionUrl = (v: PluginVersion) => {
    if (v.download_url) return v.download_url;
    if (v.jar_path) {
      const { data } = supabase.storage.from("plugin-jars").getPublicUrl(v.jar_path);
      return data.publicUrl;
    }
    return null;
  };

  const latestDownloadUrl =
    plugin?.download_url ||
    (versions.length > 0 ? resolveVersionUrl(versions[0]) : null);


  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const platforms = (
    plugin?.platforms && plugin.platforms.length
      ? plugin.platforms
      : (plugin?.platform || "")
          .split(/[,/|]/)
          .map((p) => p.trim())
          .filter(Boolean)
  ).map((p) => p.toLowerCase());

  const mcVersions = plugin?.mc_versions ?? [];


  const downloadVersion = async (v: PluginVersion) => {
    if (!plugin) return;
    const url = resolveVersionUrl(v);
    if (!url) return;
    const sanitize = (s: string | null) => (s ? s.replace(/\s+/g, "-") : "");
    const filename =
      v.jar_filename ||
      [sanitize(plugin.name), sanitize(plugin.platform), sanitize(v.version)]
        .filter(Boolean)
        .join("-") + ".jar";
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank", "noopener");
    }
  };

  const doDownload = async () => {
    if (!plugin || !latestDownloadUrl) return;
    const filename = buildJarName(plugin, selectedPlatform);
    try {
      const res = await fetch(latestDownloadUrl);
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
      window.open(latestDownloadUrl, "_blank", "noopener");
    }
  };

  const handleDownload = () => {
    if (!latestDownloadUrl) return;
    if (platforms.length === 1) setSelectedPlatform((p) => p ?? platforms[0]);
    if (mcVersions.length === 1) setSelectedVersion((v) => v ?? mcVersions[0]);
    setDownloadOpen(true);
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
                {latestDownloadUrl ? (
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
                    {latestDownloadUrl && (
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
                      {versions.length > 0 ? (
                        versions.map((v, i) => {
                          const url = resolveVersionUrl(v);
                          return (
                            <div key={v.id} className="flex items-start justify-between p-3 rounded-md border border-border gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">v{v.version}</span>
                                  {i === 0 && <Badge>Latest</Badge>}
                                  <span className="text-xs text-muted-foreground">{timeAgo(v.created_at)}</span>
                                </div>
                                {v.jar_filename && (
                                  <div className="text-xs text-muted-foreground mt-0.5">
                                    {v.jar_filename}
                                    {v.jar_size ? ` · ${formatSize(v.jar_size)}` : ""}
                                  </div>
                                )}
                                {v.changelog && (
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap mt-1.5">{v.changelog}</p>
                                )}
                              </div>
                              {url ? (
                                <Button size="sm" variant="outline" onClick={() => downloadVersion(v)}>
                                  <Download className="h-4 w-4 mr-1" /> Download
                                </Button>
                              ) : null}

                            </div>
                          );
                        })
                      ) : latestDownloadUrl && plugin ? (
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
                  {mcVersions.length > 0 && (() => {
                    const groups = new Map<string, string[]>();
                    const singles: string[] = [];
                    for (const v of mcVersions) {
                      const m = v.match(/^(\d+\.\d+)(?:\.\d+)?$/);
                      if (m) {
                        const arr = groups.get(m[1]) ?? [];
                        arr.push(v);
                        groups.set(m[1], arr);
                      } else {
                        singles.push(v);
                      }
                    }
                    const display: string[] = [];
                    for (const [base, arr] of groups) {
                      if (arr.length >= 3) display.push(`${base}.x`);
                      else display.push(...arr);
                    }
                    display.push(...singles);
                    return (
                      <>
                        <div className="text-sm font-semibold mb-1">Minecraft versions</div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {display.map((v) => (
                            <Badge key={v} variant="secondary" className="rounded-full">{v}</Badge>
                          ))}
                        </div>
                      </>
                    );
                  })()}
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
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-5xl p-2 bg-background/95 border-border">
          {lightbox && (
            <img
              src={lightbox}
              alt="Screenshot"
              className="w-full h-auto rounded-md object-contain max-h-[85vh]"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              {plugin?.icon_url ? (
                <img src={plugin.icon_url} alt="" className="h-7 w-7 rounded-md object-cover border border-border" />
              ) : (
                <div className="h-7 w-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Puzzle className="h-4 w-4 text-primary" />
                </div>
              )}
              <span>Download {plugin?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="rounded-md border border-border bg-background/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setVersionOpen((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-accent/40 transition-colors"
              >
                <span className="flex items-center gap-2 text-foreground/90">
                  <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                  {selectedVersion ? `Game version: ${selectedVersion}` : "Select game version"}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${versionOpen ? "rotate-180" : ""}`} />
              </button>

              {versionOpen && (
                <div className="border-t border-border">
                  {mcVersions.length > 4 && (
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={versionQuery}
                          onChange={(e) => setVersionQuery(e.target.value)}
                          placeholder="Search game versions..."
                          className="h-8 pl-8 text-sm bg-background/60"
                        />
                      </div>
                    </div>
                  )}
                  <div className="max-h-56 overflow-y-auto px-2 pb-2 pt-2 space-y-1">
                    {mcVersions.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">No supported versions listed.</div>
                    ) : (
                      mcVersions
                        .filter((v) => v.toLowerCase().includes(versionQuery.toLowerCase()))
                        .map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              setSelectedVersion(v);
                              setVersionOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                              selectedVersion === v
                                ? "bg-primary/15 text-primary"
                                : "hover:bg-accent/50 text-foreground/85"
                            }`}
                          >
                            {v}
                          </button>
                        ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-md border border-border bg-background/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setPlatformOpen((v) => !v)}
                disabled={platforms.length === 0}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-accent/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span className="flex items-center gap-2 text-foreground/90">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  {selectedPlatform
                    ? `Platform: ${PLATFORM_LABELS[selectedPlatform] ?? selectedPlatform}`
                    : platforms.length === 0
                      ? "Platform: Unknown"
                      : "Select platform"}
                </span>
                {platforms.length > 0 && (
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${platformOpen ? "rotate-180" : ""}`} />
                )}
              </button>
              {platformOpen && platforms.length > 0 && (
                <div className="border-t border-border max-h-56 overflow-y-auto p-2 space-y-1">
                  {platforms.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setSelectedPlatform(p);
                        setPlatformOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm transition-colors ${
                        selectedPlatform === p
                          ? "bg-primary/15 text-primary"
                          : "hover:bg-accent/50 text-foreground/85"
                      }`}
                    >
                      {PLATFORM_LABELS[p] ?? p}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-md border border-border bg-background/40 px-3 py-2 flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground truncate font-mono">
                {plugin ? buildJarName(plugin, selectedPlatform) : ""}
              </span>
            </div>

            <Button
              onClick={() => {
                doDownload();
                setDownloadOpen(false);
              }}
              disabled={!latestDownloadUrl}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download {plugin?.version ? `v${plugin.version}` : "jar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PluginDetail;
