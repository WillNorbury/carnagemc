import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import { ICON_NAMES, getIcon } from "@/lib/features";
import { confirm } from "@/lib/confirm";

type FeatureRow = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  description: string;
  long_description: string;
  highlights: string[];
  sort_order: number;
  published: boolean;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const emptyDraft = (sort_order = 0): Omit<FeatureRow, "id"> => ({
  slug: "",
  title: "",
  icon: "Sparkles",
  description: "",
  long_description: "",
  highlights: [],
  sort_order,
  published: true,
});

export const FeaturesTab = () => {
  const [rows, setRows] = useState<FeatureRow[]>([]);
  const [editing, setEditing] = useState<FeatureRow | (Omit<FeatureRow, "id"> & { id?: string }) | null>(null);
  const [highlightsText, setHighlightsText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("features").select("*").order("sort_order", { ascending: true });
    setRows((data ?? []) as FeatureRow[]);
  };
  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    const next = (rows[rows.length - 1]?.sort_order ?? 0) + 10;
    setEditing(emptyDraft(next));
    setHighlightsText("");
  };

  const startEdit = (r: FeatureRow) => {
    setEditing(r);
    setHighlightsText(r.highlights.join("\n"));
  };

  const cancel = () => {
    setEditing(null);
    setHighlightsText("");
  };

  const save = async () => {
    if (!editing) return;
    const slug = (editing.slug || slugify(editing.title)).trim();
    if (!slug || !editing.title.trim() || !editing.description.trim()) {
      toast.error("Title, slug, and short description are required");
      return;
    }
    const payload = {
      slug,
      title: editing.title.trim(),
      icon: editing.icon,
      description: editing.description.trim(),
      long_description: editing.long_description ?? "",
      highlights: highlightsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      sort_order: editing.sort_order,
      published: editing.published,
    };
    setSaving(true);
    try {
      if ("id" in editing && editing.id) {
        const { error } = await supabase.from("features").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Feature updated");
      } else {
        const { error } = await supabase.from("features").insert(payload);
        if (error) throw error;
        toast.success("Feature created");
      }
      cancel();
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: FeatureRow) => {
    const ok = await confirm({
      title: "Delete feature?",
      description: `This will remove "${r.title}" from the website.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("features").delete().eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Feature deleted");
    load();
  };

  const move = async (r: FeatureRow, dir: -1 | 1) => {
    const idx = rows.findIndex((x) => x.id === r.id);
    const swap = rows[idx + dir];
    if (!swap) return;
    await supabase.from("features").update({ sort_order: swap.sort_order }).eq("id", r.id);
    await supabase.from("features").update({ sort_order: r.sort_order }).eq("id", swap.id);
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold">Features</h2>
            <p className="text-xs text-muted-foreground">
              Shown on the homepage and at /features. First in the list shows first.
            </p>
          </div>
          <Button onClick={startNew} size="sm">
            <Plus className="h-4 w-4 mr-1" /> New feature
          </Button>
        </div>

        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No features yet.</p>
          )}
          {rows.map((r, i) => {
            const Icon = getIcon(r.icon);
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card/50"
              >
                <div className="flex flex-col">
                  <button
                    onClick={() => move(r, -1)}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(r, 1)}
                    disabled={i === rows.length - 1}
                    className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                  >
                    ▼
                  </button>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <div className="h-9 w-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{r.title}</span>
                    {!r.published && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground border px-1.5 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">/features/{r.slug}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => startEdit(r)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => remove(r)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {editing && (
        <Card className="p-6 space-y-4 border-primary/40">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">{"id" in editing && editing.id ? "Edit feature" : "New feature"}</h3>
            <Switch
              checked={editing.published}
              onCheckedChange={(v) => setEditing({ ...editing, published: v })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input
                value={editing.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditing({
                    ...editing,
                    title,
                    slug: editing.slug || slugify(title),
                  });
                }}
                placeholder="Lifesteal PvP"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                placeholder="lifesteal-pvp"
              />
            </div>
            <div>
              <Label>Icon</Label>
              <Select value={editing.icon} onValueChange={(v) => setEditing({ ...editing, icon: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {ICON_NAMES.map((n) => {
                    const I = getIcon(n);
                    return (
                      <SelectItem key={n} value={n}>
                        <span className="inline-flex items-center gap-2">
                          <I className="h-3.5 w-3.5" /> {n}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div>
            <Label>Short description</Label>
            <Textarea
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              rows={2}
            />
          </div>

          <div>
            <Label>Long description</Label>
            <Textarea
              value={editing.long_description}
              onChange={(e) => setEditing({ ...editing, long_description: e.target.value })}
              rows={5}
            />
          </div>

          <div>
            <Label>Highlights (one per line)</Label>
            <Textarea
              value={highlightsText}
              onChange={(e) => setHighlightsText(e.target.value)}
              rows={4}
              placeholder={"Steal hearts from kills\nPermadeath at zero hearts"}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save feature"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
