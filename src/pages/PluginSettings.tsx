import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Info,
  Tag,
  AlignLeft,
  GitBranch,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Users,
  BarChart3,
  Upload,
  Trash2,
  LayoutGrid,
  Loader2,
  Puzzle,
} from "lucide-react";

type Plugin = {
  id: string;
  short_id: string;
  slug: string | null;
  name: string;
  description: string | null;
  long_description: string | null;
  icon_url: string | null;
  published: boolean;
  user_id: string | null;
};

type Section =
  | "general"
  | "tags"
  | "description"
  | "versions"
  | "license"
  | "gallery"
  | "links"
  | "members"
  | "analytics";

const SECTIONS: { id: Section; label: string; icon: typeof Info }[] = [
  { id: "general", label: "General", icon: Info },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "description", label: "Description", icon: AlignLeft },
  { id: "versions", label: "Versions", icon: GitBranch },
  { id: "license", label: "License", icon: FileText },
  { id: "gallery", label: "Gallery", icon: ImageIcon },
  { id: "links", label: "Links", icon: LinkIcon },
  { id: "members", label: "Members", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const PluginSettings = () => {
  const { slug: key } = useParams();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [plugin, setPlugin] = useState<Plugin | null>(null);
  const [section, setSection] = useState<Section>("general");

  // form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [published, setPublished] = useState(true);
  const [monetization, setMonetization] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const iconRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!key) return;
    (async () => {
      setLoading(true);
      let { data } = await supabase.from("plugins").select("*").eq("slug", key).maybeSingle();
      if (!data) {
        const fb = await supabase.from("plugins").select("*").eq("short_id", key).maybeSingle();
        data = fb.data;
      }
      if (data) {
        const p = data as Plugin;
        setPlugin(p);
        setName(p.name);
        setSlug(p.slug ?? "");
        setDescription(p.description ?? "");
        setIconUrl(p.icon_url);
        setPublished(p.published);
        document.title = `${p.name} — Settings — HavocSMP`;
      }
      setLoading(false);
    })();
  }, [key]);

  if (authLoading || loading) return <PageLoader loading={true} />;

  if (!plugin) {
    return (
      <>
        <Navbar />
        <main className="container max-w-4xl py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Plugin not found</h1>
          <Button asChild variant="outline" className="mt-4">
            <Link to="/discover/plugins">Browse plugins</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  const isOwner = !!user && (plugin.user_id === user.id || isAdmin);

  if (!isOwner) {
    return (
      <>
        <Navbar />
        <main className="container max-w-4xl py-16 text-center">
          <h1 className="font-display text-2xl font-bold mb-2">Access denied</h1>
          <p className="text-muted-foreground">You don't have permission to edit this plugin.</p>
          <Button asChild variant="outline" className="mt-4">
            <Link to={`/plugin/${plugin.slug ?? plugin.short_id}`}>Back to plugin</Link>
          </Button>
        </main>
        <Footer />
      </>
    );
  }

  const uploadIcon = async (file: File) => {
    setUploadingIcon(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${plugin.user_id ?? user!.id}/icons/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("plugin-screenshots").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      setUploadingIcon(false);
      return;
    }
    const { data: pub } = supabase.storage.from("plugin-screenshots").getPublicUrl(path);
    setIconUrl(pub.publicUrl);
    setUploadingIcon(false);
  };

  const saveGeneral = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    const cleanSlug = slugify(slug);
    if (slug.trim() && !cleanSlug) {
      toast.error("URL slug must contain letters or numbers");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("plugins")
      .update({
        name: name.trim(),
        slug: cleanSlug || null,
        description: description.trim() || null,
        icon_url: iconUrl,
        published,
      })
      .eq("id", plugin.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    if (cleanSlug && cleanSlug !== key) {
      navigate(`/plugins/${cleanSlug}/settings`, { replace: true });
    }
    setPlugin({ ...plugin, name: name.trim(), slug: cleanSlug || null, description: description.trim() || null, icon_url: iconUrl, published });
  };

  const removeIcon = () => setIconUrl(null);

  const deletePlugin = async () => {
    if (!confirm(`Delete "${plugin.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    const { error } = await supabase.from("plugins").delete().eq("id", plugin.id);
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Plugin deleted");
    navigate("/dashboard");
  };

  const pluginUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/plugin/${slug || plugin.short_id}`;

  return (
    <>
      <Navbar />
      <main className="container max-w-6xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt=""
                className="h-10 w-10 rounded-md object-cover border border-border shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                <Puzzle className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to={`/plugin/${plugin.slug ?? plugin.short_id}`}
                className="font-display font-bold text-lg truncate hover:text-primary transition-colors"
              >
                {plugin.name}
              </Link>
              <span className="text-muted-foreground">›</span>
              <span className="font-display font-bold text-lg">Settings</span>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">
              <LayoutGrid className="h-4 w-4 mr-1.5" /> Visit projects dashboard
            </Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <Card className="p-2 h-fit">
            <nav className="flex flex-col gap-0.5">
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                const active = section === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSection(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                      active
                        ? "bg-primary/15 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                );
              })}
            </nav>
          </Card>

          {/* Content */}
          <div className="space-y-6 min-w-0">
            {section === "general" && (
              <>
                <Card className="p-6 space-y-5">
                  <h2 className="font-display font-bold text-xl">Project information</h2>

                  <div className="space-y-2">
                    <Label htmlFor="ps-name">Name</Label>
                    <Input
                      id="ps-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ps-slug">URL</Label>
                    <div className="flex items-center gap-1 rounded-md border border-input bg-background overflow-hidden">
                      <span className="pl-3 pr-1 text-sm text-muted-foreground whitespace-nowrap">
                        {(typeof window !== "undefined" ? window.location.origin : "")}/plugin/
                      </span>
                      <Input
                        id="ps-slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                        placeholder={plugin.short_id}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{pluginUrl}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ps-desc">Summary</Label>
                    <Textarea
                      id="ps-desc"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      maxLength={500}
                      placeholder="A short summary of your plugin"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Icon <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt=""
                          className="h-20 w-20 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                          <Puzzle className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <input
                          ref={iconRef}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => e.target.files?.[0] && uploadIcon(e.target.files[0])}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => iconRef.current?.click()}
                          disabled={uploadingIcon}
                        >
                          {uploadingIcon ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1.5" />
                          )}
                          Upload icon
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={removeIcon}
                          disabled={!iconUrl}
                        >
                          <Trash2 className="h-4 w-4 mr-1.5" /> Remove icon
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ps-vis">Visibility</Label>
                    <Select
                      value={published ? "public" : "draft"}
                      onValueChange={(v) => setPublished(v === "public")}
                    >
                      <SelectTrigger id="ps-vis">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start justify-between gap-4 pt-2 border-t border-border/60">
                    <div>
                      <Label className="text-sm font-medium">Monetization</Label>
                      <p className="text-xs text-muted-foreground mt-1 max-w-prose">
                        When enabled, this project can earn revenue through the HavocSMP Rewards
                        Program. If you don't want to (or can't for legal reasons) earn revenue
                        from this project, you can turn it off here.
                      </p>
                    </div>
                    <Switch checked={monetization} onCheckedChange={setMonetization} />
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button onClick={saveGeneral} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save changes
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 border-destructive/40">
                  <h2 className="font-display font-bold text-xl mb-2">Delete project</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Removes your project from HavocSMP's servers and search. Clicking on this will
                    delete your project, so be extra careful!
                  </p>
                  <Button variant="destructive" onClick={deletePlugin} disabled={deleting}>
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete project
                  </Button>
                </Card>
              </>
            )}

            {section !== "general" && (
              <Card className="p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {SECTIONS.find((s) => s.id === section)?.label} settings coming soon. For now,
                  manage this from your dashboard.
                </p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/dashboard">Open dashboard</Link>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PluginSettings;
