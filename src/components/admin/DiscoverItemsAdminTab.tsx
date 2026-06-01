import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";

export type DiscoverKind = "resource_pack" | "data_pack" | "shader" | "modpack" | "server";

type Row = {
  id: string;
  kind: DiscoverKind;
  user_id: string | null;
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
  created_at: string;
  updated_at: string;
};

const emptyForm = {
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
};

const KIND_LABEL: Record<DiscoverKind, string> = {
  resource_pack: "Resource Pack",
  data_pack: "Data Pack",
  shader: "Shader",
  modpack: "Modpack",
  server: "Server",
};

export const DiscoverItemsAdminTab = ({ kind }: { kind: DiscoverKind }) => {
  const [items, setItems] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const label = KIND_LABEL[kind];

  const load = async () => {
    const { data, error } = await supabase
      .from("discover_items")
      .select("*")
      .eq("kind", kind)
      .order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setItems((data ?? []) as Row[]);
  };

  useEffect(() => {
    load();
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const startEdit = (r: Row) => {
    setEditingId(r.id);
    setForm({
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
    setShowForm(true);
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(false);
  };

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const payload = {
      kind,
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      description: form.description.trim() || null,
      long_description: form.long_description.trim() || null,
      author: form.author.trim() || null,
      version: form.version.trim() || null,
      icon_url: form.icon_url.trim() || null,
      banner_url: form.banner_url.trim() || null,
      download_url: form.download_url.trim() || null,
      external_url: form.external_url.trim() || null,
      category: form.category.trim() || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      featured: form.featured,
      published: form.published,
    };
    const { error } = editingId
      ? await supabase.from("discover_items").update(payload).eq("id", editingId)
      : await supabase
          .from("discover_items")
          .insert({ ...payload, user_id: auth.user?.id ?? null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(editingId ? `${label} updated` : `${label} added`);
    reset();
    load();
  };

  const remove = async (id: string) => {
    if (
      !(await confirm({
        title: `Delete ${label.toLowerCase()}?`,
        description: "This action can't be undone.",
        confirmText: "Delete",
        destructive: true,
      }))
    )
      return;
    const { error } = await supabase.from("discover_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`${label} deleted`);
    if (editingId === id) reset();
    load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.author ?? "").toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q),
    );
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${label.toLowerCase()}s...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          onClick={() => {
            reset();
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> New {label}
        </Button>
      </div>

      {showForm && (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{editingId ? `Edit ${label}` : `New ${label}`}</h3>
            <Button variant="ghost" size="icon" onClick={reset}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Slug">
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto from name" />
            </Field>
            <Field label="Author">
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </Field>
            <Field label="Version">
              <Input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
            </Field>
            <Field label="Category">
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </Field>
            <Field label="Tags (comma-separated)">
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </Field>
            <Field label="Icon URL">
              <Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} />
            </Field>
            <Field label="Banner URL">
              <Input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} />
            </Field>
            <Field label={kind === "server" ? "Server IP / connect URL" : "Download URL"}>
              <Input value={form.download_url} onChange={(e) => setForm({ ...form, download_url: e.target.value })} />
            </Field>
            <Field label="External / source URL">
              <Input value={form.external_url} onChange={(e) => setForm({ ...form, external_url: e.target.value })} />
            </Field>
          </div>

          <Field label="Short description">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="Long description">
            <Textarea
              rows={5}
              value={form.long_description}
              onChange={(e) => setForm({ ...form, long_description: e.target.value })}
            />
          </Field>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              <Label>Featured</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
              <Label>Published</Label>
            </div>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" onClick={reset} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={saving}>
                {saving ? "Saving..." : editingId ? "Save changes" : `Create ${label}`}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No {label.toLowerCase()}s yet.
          </Card>
        ) : (
          filtered.map((r) => (
            <Card key={r.id} className="p-4 flex items-center gap-4">
              {r.icon_url ? (
                <img
                  src={r.icon_url}
                  alt=""
                  className="h-12 w-12 rounded-md object-cover border border-border"
                />
              ) : (
                <div className="h-12 w-12 rounded-md border border-border bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold truncate">{r.name}</h4>
                  {r.version && (
                    <Badge variant="outline" className="text-xs">
                      v{r.version}
                    </Badge>
                  )}
                  {r.featured && (
                    <Badge className="text-xs bg-primary/15 text-primary border border-primary/40">
                      Featured
                    </Badge>
                  )}
                  {!r.published && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Draft
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {r.description ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {r.author ? `by ${r.author}` : "Unknown author"}
                  {r.category ? ` · ${r.category}` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default DiscoverItemsAdminTab;
