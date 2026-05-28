import { useEffect, useRef, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";
import {
  ArrowLeft, Plus, Pencil, Trash2, Upload, Download, Boxes, Loader2,
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
  jar_path: string | null;
  jar_filename: string | null;
  jar_size: number | null;
  download_url: string | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const blank = {
  name: "",
  slug: "",
  description: "",
  long_description: "",
  version: "",
  mc_version: "",
  loader: "Forge",
  author: "",
  icon_url: "",
  category: "",
  tags: "",
  download_url: "",
  featured: false,
  published: true,
  sort_order: 0,
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const AdminMods = () => {
  const { user, isAdmin, loading } = useAuth();
  const [items, setItems] = useState<Mod[]>([]);
  const [editing, setEditing] = useState<Mod | null>(null);
  const [form, setForm] = useState(blank);
  const [jarFile, setJarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const jarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Mods — Admin · XyloMC";
    load();
  }, []);

  const load = async () => {
    const { data } = await (supabase.from("mods" as any) as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setItems((data as Mod[]) ?? []);
  };

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const startEdit = (m: Mod) => {
    setEditing(m);
    setForm({
      name: m.name,
      slug: m.slug ?? "",
      description: m.description ?? "",
      long_description: m.long_description ?? "",
      version: m.version ?? "",
      mc_version: m.mc_version ?? "",
      loader: m.loader ?? "Forge",
      author: m.author ?? "",
      icon_url: m.icon_url ?? "",
      category: m.category ?? "",
      tags: (m.tags ?? []).join(", "),
      download_url: m.download_url ?? "",
      featured: m.featured,
      published: m.published,
      sort_order: m.sort_order,
    });
    setJarFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setEditing(null);
    setForm(blank);
    setJarFile(null);
    if (jarInputRef.current) jarInputRef.current.value = "";
  };

  const uploadJar = async (modId: string): Promise<Partial<Mod> | null> => {
    if (!jarFile) return null;
    setUploading(true);
    const safeName = jarFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${modId}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage
      .from("mod-jars")
      .upload(path, jarFile, { upsert: true, contentType: "application/java-archive" });
    setUploading(false);
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    return { jar_path: path, jar_filename: jarFile.name, jar_size: jarFile.size };
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);

    const finalSlug = slugify(form.slug.trim() || form.name);
    if (!finalSlug) {
      toast.error("Slug is required");
      setSaving(false);
      return;
    }

    const payload: any = {
      name: form.name.trim(),
      slug: finalSlug,
      description: form.description.trim() || null,
      long_description: form.long_description.trim() || null,
      version: form.version.trim() || null,
      mc_version: form.mc_version.trim() || null,
      loader: form.loader.trim() || null,
      author: form.author.trim() || null,
      icon_url: form.icon_url.trim() || null,
      category: form.category.trim() || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      download_url: form.download_url.trim() || null,
      featured: form.featured,
      published: form.published,
      sort_order: form.sort_order,
    };

    if (editing) {
      const upload = await uploadJar(editing.id);
      if (upload) Object.assign(payload, upload);
      const { error } = await (supabase.from("mods" as any) as any)
        .update(payload)
        .eq("id", editing.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Mod updated");
        reset();
        load();
      }
    } else {
      const { data, error } = await (supabase.from("mods" as any) as any)
        .insert(payload)
        .select()
        .single();
      if (error || !data) {
        toast.error(error?.message ?? "Failed to create");
      } else {
        const newId = (data as any).id as string;
        const upload = await uploadJar(newId);
        if (upload) {
          await (supabase.from("mods" as any) as any).update(upload).eq("id", newId);
        }
        toast.success("Mod created");
        reset();
        load();
      }
    }
    setSaving(false);
  };

  const del = async (m: Mod) => {
    if (!(await confirm({ title: `Delete "${m.name}"?`, description: "This cannot be undone." }))) return;
    if (m.jar_path) {
      await supabase.storage.from("mod-jars").remove([m.jar_path]);
    }
    const { error } = await (supabase.from("mods" as any) as any).delete().eq("id", m.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  const getUrl = (m: Mod) => {
    if (m.download_url) return m.download_url;
    if (m.jar_path) {
      const { data } = supabase.storage.from("mod-jars").getPublicUrl(m.jar_path);
      return data.publicUrl;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back to admin</Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Boxes className="h-7 w-7 text-primary" /> Mods
          </h1>
          <p className="text-muted-foreground">Upload and manage .jar mods shown on /mods.</p>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="font-display font-bold text-lg">{editing ? `Edit "${editing.name}"` : "Create mod"}</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Author</Label>
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div>
              <Label>Loader</Label>
              <Input
                value={form.loader}
                onChange={(e) => setForm({ ...form, loader: e.target.value })}
                placeholder="Forge / Fabric / Quilt"
              />
            </div>
            <div>
              <Label>Minecraft version</Label>
              <Input value={form.mc_version} onChange={(e) => setForm({ ...form, mc_version: e.target.value })} placeholder="1.20.1" />
            </div>
            <div>
              <Label>Mod version</Label>
              <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0.0" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Performance" />
            </div>
            <div className="sm:col-span-2">
              <Label>Icon URL</Label>
              <Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>Tags (comma separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="optimization, qol" />
            </div>
          </div>

          <div>
            <Label>Short description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <Label>Long description</Label>
            <Textarea
              rows={4}
              value={form.long_description}
              onChange={(e) => setForm({ ...form, long_description: e.target.value })}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>External download URL (optional)</Label>
              <Input
                value={form.download_url}
                onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground mt-1">If set, this overrides the uploaded jar.</p>
            </div>
            <div>
              <Label>.jar file upload</Label>
              <Input
                ref={jarInputRef}
                type="file"
                accept=".jar,application/java-archive"
                onChange={(e) => setJarFile(e.target.files?.[0] ?? null)}
              />
              {jarFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {jarFile.name} · {formatSize(jarFile.size)}
                </p>
              )}
              {editing?.jar_filename && !jarFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {editing.jar_filename} {editing.jar_size ? `· ${formatSize(editing.jar_size)}` : ""}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-6">
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="w-28"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label>Featured</Label>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>Published</Label>
            </div>
            <div className="flex-1" />
            {editing && (
              <Button variant="ghost" onClick={reset}>Cancel</Button>
            )}
            <Button onClick={save} disabled={saving || uploading}>
              {(saving || uploading) ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : editing ? (
                <Pencil className="h-4 w-4 mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              {uploading ? "Uploading..." : editing ? "Save" : "Create"}
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {items.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No mods yet. Create one above.</Card>
          ) : (
            items.map((m) => {
              const url = getUrl(m);
              return (
                <Card key={m.id} className="p-4 flex items-start gap-4">
                  {m.icon_url ? (
                    <img src={m.icon_url} alt="" className="h-12 w-12 rounded-md object-cover border border-border" />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                      <Boxes className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium truncate">{m.name}</h3>
                      <span className="text-xs text-muted-foreground font-mono">#{m.short_id}</span>
                      {!m.published && <Badge variant="outline">Draft</Badge>}
                      {m.featured && <Badge>Featured</Badge>}
                      {m.loader && <Badge variant="secondary">{m.loader}</Badge>}
                      {m.mc_version && <Badge variant="outline">MC {m.mc_version}</Badge>}
                      {m.version && <Badge variant="outline">v{m.version}</Badge>}
                    </div>
                    {m.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{m.description}</p>
                    )}
                    {m.jar_filename && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {m.jar_filename} · {formatSize(m.jar_size)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {url && (
                      <Button size="icon" variant="ghost" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => startEdit(m)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => del(m)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMods;
