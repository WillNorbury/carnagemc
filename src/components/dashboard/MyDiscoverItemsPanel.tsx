import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ExternalLink,
  Palette,
  Sparkles,
  Box,
  Server,
  FileCode,
  ChevronDown,
  Upload,
  FileArchive,
  X,
} from "lucide-react";


export type DiscoverKind = "resource_pack" | "data_pack" | "shader" | "modpack" | "server";

type Row = {
  id: string;
  kind: DiscoverKind;
  name: string;
  slug: string | null;
  description: string | null;
  long_description: string | null;
  author: string | null;
  version: string | null;
  icon_url: string | null;
  banner_url: string | null;
  download_url: string | null;
  external_url: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
  published: boolean;
};

const KIND_META: Record<
  DiscoverKind,
  {
    label: string;
    plural: string;
    icon: React.ComponentType<{ className?: string }>;
    route: string;
    downloadLabel: string;
    downloadPlaceholder: string;
    categoryPlaceholder: string;
    versionLabel: string;
    versionPlaceholder: string;
  }
> = {
  resource_pack: {
    label: "Resource Pack",
    plural: "Resource Packs",
    icon: Palette,
    route: "/discover/resource-packs",
    downloadLabel: "Download URL",
    downloadPlaceholder: "https://example.com/pack.zip",
    categoryPlaceholder: "e.g. Realistic, Cartoon, 16x",
    versionLabel: "Pack version",
    versionPlaceholder: "1.0.0",
  },
  data_pack: {
    label: "Data Pack",
    plural: "Data Packs",
    icon: FileCode,
    route: "/discover/data-packs",
    downloadLabel: "Download URL",
    downloadPlaceholder: "https://example.com/datapack.zip",
    categoryPlaceholder: "e.g. Adventure, Utility, Mobs",
    versionLabel: "Pack version",
    versionPlaceholder: "1.0.0",
  },
  shader: {
    label: "Shader",
    plural: "Shaders",
    icon: Sparkles,
    route: "/discover/shaders",
    downloadLabel: "Download URL",
    downloadPlaceholder: "https://example.com/shader.zip",
    categoryPlaceholder: "e.g. Realistic, Cartoon, Performance",
    versionLabel: "Shader version",
    versionPlaceholder: "1.0.0",
  },
  modpack: {
    label: "Modpack",
    plural: "Modpacks",
    icon: Box,
    route: "/discover/modpacks",
    downloadLabel: "Download / CurseForge URL",
    downloadPlaceholder: "https://curseforge.com/...",
    categoryPlaceholder: "e.g. Tech, Magic, Adventure",
    versionLabel: "Modpack version",
    versionPlaceholder: "1.0.0",
  },
  server: {
    label: "Server",
    plural: "Servers",
    icon: Server,
    route: "/discover/servers",
    downloadLabel: "Server IP / connect URL",
    downloadPlaceholder: "play.example.com",
    categoryPlaceholder: "e.g. SMP, Survival, Minigames",
    versionLabel: "Server version",
    versionPlaceholder: "1.21.4",
  },
};

const KINDS: DiscoverKind[] = ["resource_pack", "data_pack", "shader", "modpack", "server"];

type FormState = {
  id: string | null;
  kind: DiscoverKind;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  author: string;
  version: string;
  icon_url: string;
  banner_url: string;
  download_url: string;
  external_url: string;
  category: string;
  tags: string;
  featured: boolean;
  published: boolean;
};

const emptyForm = (kind: DiscoverKind): FormState => ({
  id: null,
  kind,
  name: "",
  slug: "",
  description: "",
  long_description: "",
  author: "",
  version: "",
  icon_url: "",
  banner_url: "",
  download_url: "",
  external_url: "",
  category: "",
  tags: "",
  featured: false,
  published: true,
});

export default function MyDiscoverItemsPanel({ userId }: { userId: string }) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [uploadingZip, setUploadingZip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("discover_items")
      .select("*")
      .eq("user_id", userId)
      .in("kind", KINDS)
      .order("updated_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const openNew = (kind: DiscoverKind) => {
    setZipFile(null);
    setForm(emptyForm(kind));
  };

  const openEdit = (r: Row) => {
    setZipFile(null);
    setForm({
      id: r.id,
      kind: r.kind,
      name: r.name,
      slug: r.slug ?? "",
      description: r.description ?? "",
      long_description: r.long_description ?? "",
      author: r.author ?? "",
      version: r.version ?? "",
      icon_url: r.icon_url ?? "",
      banner_url: r.banner_url ?? "",
      download_url: r.download_url ?? "",
      external_url: r.external_url ?? "",
      category: r.category ?? "",
      tags: (r.tags ?? []).join(", "),
      featured: r.featured,
      published: r.published,
    });
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }

    // Resource packs require a .zip file on create
    if (form.kind === "resource_pack" && !form.id && !zipFile) {
      toast.error("Please upload a .zip file for the resource pack");
      return;
    }

    setSaving(true);

    let downloadUrl = form.download_url.trim() || null;

    // Upload zip file for resource packs
    if (form.kind === "resource_pack" && zipFile) {
      setUploadingZip(true);
      const filePath = `${userId}/${Date.now()}_${zipFile.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("resource-packs")
        .upload(filePath, zipFile, { upsert: true, contentType: "application/zip" });
      setUploadingZip(false);
      if (uploadError) {
        setSaving(false);
        toast.error(`Upload failed: ${uploadError.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("resource-packs").getPublicUrl(filePath);
      downloadUrl = urlData.publicUrl;
    }

    const payload = {
      kind: form.kind,
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      description: form.description.trim() || null,
      long_description: form.long_description.trim() || null,
      author: form.author.trim() || null,
      version: form.version.trim() || null,
      icon_url: form.icon_url.trim() || null,
      banner_url: form.banner_url.trim() || null,
      download_url: downloadUrl,
      external_url: form.external_url.trim() || null,
      category: form.category.trim() || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      featured: form.featured,
      published: form.published,
    };
    const { error } = form.id
      ? await supabase.from("discover_items").update(payload).eq("id", form.id)
      : await supabase.from("discover_items").insert({ ...payload, user_id: userId });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? `${KIND_META[form.kind].label} updated` : `${KIND_META[form.kind].label} created`);
    setZipFile(null);
    setForm(null);
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("discover_items").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const meta = form ? KIND_META[form.kind] : null;
  const groupedByKind = KINDS.map((k) => ({ kind: k, list: items.filter((i) => i.kind === k) }));

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-lg">My Content</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> Create
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {KINDS.map((k) => {
              const Icon = KIND_META[k].icon;
              return (
                <DropdownMenuItem key={k} onClick={() => openNew(k)}>
                  <Icon className="h-4 w-4 mr-2" /> New {KIND_META[k].label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          You haven't published any content yet. Click "Create" to add a resource pack, data pack,
          shader, modpack, or server.
        </p>
      ) : (
        <div className="space-y-5">
          {groupedByKind
            .filter((g) => g.list.length > 0)
            .map(({ kind, list }) => {
              const m = KIND_META[kind];
              const Icon = m.icon;
              return (
                <div key={kind}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                      {m.plural}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {list.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {list.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border/60"
                      >
                        {r.icon_url ? (
                          <img
                            src={r.icon_url}
                            alt=""
                            className="h-10 w-10 rounded-md object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-display font-bold truncate">{r.name}</span>
                            {!r.published && (
                              <Badge variant="outline" className="text-amber-400 border-amber-400/40">
                                Draft
                              </Badge>
                            )}
                            {r.version && (
                              <span className="text-xs text-muted-foreground">v{r.version}</span>
                            )}
                            {r.category && (
                              <Badge variant="secondary" className="text-xs">
                                {r.category}
                              </Badge>
                            )}
                          </div>
                          {r.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {r.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {r.published && (
                            <Button asChild size="icon" variant="ghost" aria-label="View">
                              <Link to={m.route}>
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => openEdit(r)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(r)}
                            aria-label="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <Dialog open={!!form} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {form && meta && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <meta.icon className="h-5 w-5 text-primary" />
                  {form.id ? `Edit ${meta.label}` : `New ${meta.label}`}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      maxLength={80}
                      placeholder={`My awesome ${meta.label.toLowerCase()}`}
                    />
                  </div>
                  <div>
                    <Label>{meta.versionLabel}</Label>
                    <Input
                      value={form.version}
                      onChange={(e) => setForm({ ...form, version: e.target.value })}
                      maxLength={32}
                      placeholder={meta.versionPlaceholder}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Author</Label>
                    <Input
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                      placeholder="Your name or team"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder={meta.categoryPlaceholder}
                    />
                  </div>
                </div>

                <div>
                  <Label>URL slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="auto from name"
                  />
                </div>

                <div>
                  <Label>Short description</Label>
                  <Textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder={`A one-line summary of your ${meta.label.toLowerCase()}`}
                  />
                </div>

                <div>
                  <Label>Long description</Label>
                  <Textarea
                    rows={5}
                    value={form.long_description}
                    onChange={(e) => setForm({ ...form, long_description: e.target.value })}
                    placeholder="Full details, features, install instructions..."
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Icon URL</Label>
                    <Input
                      value={form.icon_url}
                      onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Banner URL</Label>
                    <Input
                      value={form.banner_url}
                      onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {form.kind === "resource_pack" ? (
                  <div className="space-y-3">
                    <div>
                      <Label>Resource Pack .zip *</Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".zip,application/zip,application/x-zip-compressed"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          if (file && !file.name.toLowerCase().endsWith(".zip")) {
                            toast.error("Only .zip files are allowed for resource packs");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                            setZipFile(null);
                            return;
                          }
                          setZipFile(file);
                        }}
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-1.5" />
                          {zipFile ? "Change .zip" : form.download_url ? "Replace .zip" : "Upload .zip"}
                        </Button>
                        {zipFile && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <FileArchive className="h-4 w-4 text-primary" />
                            <span className="truncate max-w-[200px]">{zipFile.name}</span>
                            <span className="text-xs">({(zipFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                            <button
                              type="button"
                              onClick={() => {
                                setZipFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                              }}
                              className="ml-1 text-destructive hover:text-destructive/80"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        {!zipFile && form.download_url && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <FileArchive className="h-4 w-4 text-primary" />
                            <a
                              href={form.download_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate max-w-[240px] underline hover:text-primary"
                            >
                              {form.download_url.split("/").pop() || "Current file"}
                            </a>
                          </div>
                        )}
                      </div>
                      {!zipFile && !form.download_url && (
                        <p className="text-xs text-muted-foreground mt-1.5">
                          A .zip file is required for resource packs.
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>External / source URL</Label>
                      <Input
                        value={form.external_url}
                        onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label>{meta.downloadLabel}</Label>
                      <Input
                        value={form.download_url}
                        onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                        placeholder={meta.downloadPlaceholder}
                      />
                    </div>
                    <div>
                      <Label>External / source URL</Label>
                      <Input
                        value={form.external_url}
                        onChange={(e) => setForm({ ...form, external_url: e.target.value })}
                        placeholder="https://github.com/..."
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="pvp, survival, optimization"
                  />
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={form.published}
                      onCheckedChange={(v) => setForm({ ...form, published: v })}
                    />
                    <Label>Published</Label>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setForm(null)} disabled={saving || uploadingZip}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving || uploadingZip}>
                  {(saving || uploadingZip) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {uploadingZip ? "Uploading .zip..." : form.id ? "Save changes" : `Create ${meta.label}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
