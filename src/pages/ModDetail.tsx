import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Boxes,
  Calendar,
  Download,
  Flag,
  Heart,
  Link as LinkIcon,
  Monitor,
  MoreVertical,
  Package,
} from "lucide-react";

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
  created_at: string | null;
  updated_at: string | null;
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
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

type Tab = "description" | "gallery" | "changelog" | "versions";

const ModDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [mod, setMod] = useState<Mod | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>("description");
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data } = await (supabase.from("mods" as any) as any)
        .select(
          "id, slug, short_id, name, description, long_description, version, mc_version, loader, author, icon_url, category, tags, featured, jar_path, jar_filename, jar_size, download_url, published, created_at, updated_at"
        )
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (!data) setNotFound(true);
      else {
        setMod(data as Mod);
        document.title = `${(data as Mod).name} — HavocSMP Mod`;
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!mod) return;
    (async () => {
      const { count } = await (supabase.from("mod_likes" as any) as any)
        .select("*", { count: "exact", head: true })
        .eq("mod_id", mod.id);
      setLikeCount(count ?? 0);
      if (user) {
        const [{ data: lk }, { data: sv }] = await Promise.all([
          (supabase.from("mod_likes" as any) as any)
            .select("user_id").eq("mod_id", mod.id).eq("user_id", user.id).maybeSingle(),
          (supabase.from("mod_saves" as any) as any)
            .select("user_id").eq("mod_id", mod.id).eq("user_id", user.id).maybeSingle(),
        ]);
        setLiked(!!lk);
        setSaved(!!sv);
      } else {
        setLiked(false);
        setSaved(false);
      }
    })();
  }, [mod?.id, user?.id]);

  const toggleLike = async () => {
    if (!user) { toast.error("Sign in to like mods"); return; }
    if (!mod) return;
    setActionBusy(true);
    if (liked) {
      const { error } = await (supabase.from("mod_likes" as any) as any)
        .delete().eq("mod_id", mod.id).eq("user_id", user.id);
      if (error) toast.error(error.message);
      else { setLiked(false); setLikeCount((c) => Math.max(0, c - 1)); }
    } else {
      const { error } = await (supabase.from("mod_likes" as any) as any)
        .insert({ mod_id: mod.id, user_id: user.id });
      if (error) toast.error(error.message);
      else { setLiked(true); setLikeCount((c) => c + 1); }
    }
    setActionBusy(false);
  };

  const toggleSave = async () => {
    if (!user) { toast.error("Sign in to save mods"); return; }
    if (!mod) return;
    setActionBusy(true);
    if (saved) {
      const { error } = await (supabase.from("mod_saves" as any) as any)
        .delete().eq("mod_id", mod.id).eq("user_id", user.id);
      if (error) toast.error(error.message);
      else { setSaved(false); toast.success("Removed from saved"); }
    } else {
      const { error } = await (supabase.from("mod_saves" as any) as any)
        .insert({ mod_id: mod.id, user_id: user.id });
      if (error) toast.error(error.message);
      else { setSaved(true); toast.success("Saved"); }
    }
    setActionBusy(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const reportMod = () => {
    toast.success("Report submitted — thanks for letting us know");
  };

  const url = mod
    ? mod.download_url
      ? mod.download_url
      : mod.jar_path
        ? supabase.storage.from("mod-jars").getPublicUrl(mod.jar_path).data.publicUrl
        : null
    : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: "description", label: "Description" },
    { id: "gallery", label: "Gallery" },
    { id: "changelog", label: "Changelog" },
    { id: "versions", label: "Versions" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoader loading={loading} label="Loading mod" />
      <Navbar />
      <main className="container pt-28 pb-16 max-w-6xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/discover/mods">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to mods
          </Link>
        </Button>

        {notFound && !loading && (
          <Card className="p-10 text-center">
            <h1 className="text-2xl font-bold mb-2">Mod not found</h1>
            <p className="text-muted-foreground">
              The mod you're looking for doesn't exist or isn't published.
            </p>
          </Card>
        )}

        {mod && (
          <>
            {/* Header */}
            <div className="flex items-start gap-5 pb-6 border-b border-border">
              {mod.icon_url ? (
                <img
                  src={mod.icon_url}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover border border-border shrink-0 bg-card"
                />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                  <Boxes className="h-12 w-12 text-primary" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-3xl md:text-4xl font-display font-bold leading-tight">
                  {mod.name}
                </h1>
                {mod.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 max-w-2xl">
                    {mod.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Download className="h-4 w-4" /> 0
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4" /> {likeCount}
                  </span>
                  {mod.category && (
                    <Badge variant="secondary" className="rounded-full">
                      {mod.category}
                    </Badge>
                  )}
                  {mod.tags?.slice(0, 2).map((t) => (
                    <Badge key={t} variant="secondary" className="rounded-full">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {url ? (
                  <Button
                    asChild
                    className="bg-primary hover:bg-primary/90 rounded-full px-5"
                  >
                    <a href={url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4 mr-1.5" /> Download
                    </a>
                  </Button>
                ) : (
                  <Button disabled className="rounded-full px-5">
                    Unavailable
                  </Button>
                )}
                <Button
                  variant={liked ? "default" : "outline"}
                  size="icon"
                  className="rounded-full h-10 w-10"
                  aria-label="Like"
                  onClick={toggleLike}
                  disabled={actionBusy}
                >
                  <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                </Button>
                <Button
                  variant={saved ? "default" : "outline"}
                  size="icon"
                  className="rounded-full h-10 w-10"
                  aria-label="Save"
                  onClick={toggleSave}
                  disabled={actionBusy}
                >
                  {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full h-10 w-10"
                      aria-label="More"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={copyLink}>
                      <LinkIcon className="h-4 w-4 mr-2" /> Copy link
                    </DropdownMenuItem>
                    {url && (
                      <DropdownMenuItem asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-2" /> Download jar
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={reportMod} className="text-destructive focus:text-destructive">
                      <Flag className="h-4 w-4 mr-2" /> Report mod
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Body: tabs + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 mt-6">
              {/* Main column */}
              <div>
                {/* Tabs */}
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
                      {mod.long_description || mod.description || (
                        <span className="text-muted-foreground">
                          No description provided.
                        </span>
                      )}
                    </div>
                  )}
                  {tab === "gallery" && (
                    <p className="text-sm text-muted-foreground">
                      No gallery images yet.
                    </p>
                  )}
                  {tab === "changelog" && (
                    <p className="text-sm text-muted-foreground">
                      No changelog available.
                    </p>
                  )}
                  {tab === "versions" && (
                    <div className="space-y-2">
                      {mod.jar_filename || url ? (
                        <div className="flex items-center justify-between p-3 rounded-md border border-border">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">
                              {mod.jar_filename || `${mod.name} ${mod.version ?? ""}`}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                              {mod.version && <span>v{mod.version}</span>}
                              {mod.mc_version && <span>· MC {mod.mc_version}</span>}
                              {mod.loader && <span>· {mod.loader}</span>}
                              {mod.jar_size ? <span>· {formatSize(mod.jar_size)}</span> : null}
                            </div>
                          </div>
                          {url && (
                            <Button asChild size="sm" variant="outline">
                              <a href={url} target="_blank" rel="noopener noreferrer" download>
                                <Download className="h-4 w-4 mr-1" /> Download
                              </a>
                            </Button>
                          )}
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
                  <div className="text-sm font-semibold mb-1">Minecraft: Java Edition</div>
                  {mod.mc_version && (
                    <Badge variant="secondary" className="rounded-full mb-4">
                      {mod.mc_version}
                    </Badge>
                  )}
                  {mod.loader && (
                    <>
                      <div className="text-sm font-semibold mb-1 mt-3">Platforms</div>
                      <Badge variant="secondary" className="rounded-full mb-4">
                        <Package className="h-3 w-3 mr-1" />
                        {mod.loader}
                      </Badge>
                    </>
                  )}
                  <div className="text-sm font-semibold mb-1 mt-3">Supported environments</div>
                  <Badge variant="secondary" className="rounded-full">
                    <Monitor className="h-3 w-3 mr-1" />
                    Client-side
                  </Badge>
                </Card>

                {mod.tags?.length > 0 && (
                  <Card className="p-5">
                    <h3 className="font-bold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {mod.tags.map((t) => (
                        <Badge key={t} variant="secondary" className="rounded-full">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {mod.author && (
                  <Card className="p-5">
                    <h3 className="font-bold mb-3">Creators</h3>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                        <Boxes className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{mod.author}</div>
                        <div className="text-xs text-muted-foreground">Member</div>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-5">
                  <h3 className="font-bold mb-3">Details</h3>
                  <div className="space-y-2 text-sm">
                    {mod.created_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Published {timeAgo(mod.created_at)}
                      </div>
                    )}
                    {mod.updated_at && mod.updated_at !== mod.created_at && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Updated {timeAgo(mod.updated_at)}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground/70 font-mono pt-1">
                      #{mod.short_id}
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

export default ModDetail;
