import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";

type Winner = { place?: number; player?: string; category?: string; prize?: string };
type Highlight = { title?: string; body?: string };

type Season = {
  id: string;
  slug: string;
  name: string;
  number: number | null;
  theme: string | null;
  summary: string | null;
  description: string | null;
  banner_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  winners: Winner[];
  highlights: Highlight[];
  published: boolean;
  sort_order: number;
};

const STATUSES = ["upcoming", "live", "ended"];

const slugify = (v: string) =>
  v.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const fromDateInput = (v: string) => (v ? new Date(`${v}T00:00:00Z`).toISOString() : null);

export const SeasonsAdminSection = () => {
  const [rows, setRows] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase.from("seasons" as any) as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else
      setRows(
        ((data ?? []) as any[]).map((r) => ({
          ...r,
          winners: Array.isArray(r.winners) ? r.winners : [],
          highlights: Array.isArray(r.highlights) ? r.highlights : [],
        })) as Season[],
      );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (id: string, patch: Partial<Season>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const add = async () => {
    const name = `Season ${rows.length + 1}`;
    const { error } = await (supabase.from("seasons" as any) as any).insert({
      name,
      slug: `${slugify(name)}-${Date.now().toString(36).slice(-4)}`,
      number: rows.length + 1,
      status: "upcoming",
      published: true,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Season created");
      load();
    }
  };

  const save = async (row: Season) => {
    setSaving(row.id);
    const { error } = await (supabase.from("seasons" as any) as any)
      .update({
        name: row.name,
        slug: slugify(row.slug || row.name),
        number: row.number,
        theme: row.theme,
        summary: row.summary,
        description: row.description,
        banner_url: row.banner_url,
        starts_at: row.starts_at,
        ends_at: row.ends_at,
        status: row.status,
        winners: row.winners,
        highlights: row.highlights,
        published: row.published,
        sort_order: row.sort_order,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const remove = async (row: Season) => {
    if (!(await confirm({ title: "Delete season?", description: `“${row.name}” will be removed permanently.` }))) return;
    const { error } = await (supabase.from("seasons" as any) as any).delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setRows((r) => r.filter((x) => x.id !== row.id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Seasons</h2>
          <p className="text-sm text-muted-foreground">Published seasons appear on /seasons.</p>
        </div>
        <Button onClick={add}>
          <Plus className="h-4 w-4 mr-1.5" /> New season
        </Button>
      </div>

      {rows.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">No seasons yet.</Card>
      )}

      {rows.map((row) => (
        <Card key={row.id} className="p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Name</Label>
              <Input value={row.name} onChange={(e) => update(row.id, { name: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={row.slug} onChange={(e) => update(row.id, { slug: e.target.value })} />
            </div>
            <div>
              <Label>Number</Label>
              <Input
                type="number"
                value={row.number ?? ""}
                onChange={(e) => update(row.id, { number: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <Label>Theme</Label>
              <Input value={row.theme ?? ""} onChange={(e) => update(row.id, { theme: e.target.value })} />
            </div>
            <div>
              <Label>Starts</Label>
              <Input
                type="date"
                value={toDateInput(row.starts_at)}
                onChange={(e) => update(row.id, { starts_at: fromDateInput(e.target.value) })}
              />
            </div>
            <div>
              <Label>Ends</Label>
              <Input
                type="date"
                value={toDateInput(row.ends_at)}
                onChange={(e) => update(row.id, { ends_at: fromDateInput(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex gap-2 mt-1">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={row.status === s ? "default" : "outline"}
                  onClick={() => update(row.id, { status: s })}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Summary</Label>
            <Input value={row.summary ?? ""} onChange={(e) => update(row.id, { summary: e.target.value })} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={row.description ?? ""}
              onChange={(e) => update(row.id, { description: e.target.value })}
            />
          </div>

          <div>
            <Label>Banner image URL</Label>
            <Input value={row.banner_url ?? ""} onChange={(e) => update(row.id, { banner_url: e.target.value })} />
          </div>

          {/* Winners */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Winners</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  update(row.id, { winners: [...row.winners, { place: row.winners.length + 1, player: "" }] })
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add winner
              </Button>
            </div>
            {row.winners.map((w, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[70px_1fr_1fr_1fr_auto] items-center">
                <Input
                  type="number"
                  placeholder="#"
                  value={w.place ?? ""}
                  onChange={(e) => {
                    const next = [...row.winners];
                    next[i] = { ...w, place: e.target.value === "" ? undefined : Number(e.target.value) };
                    update(row.id, { winners: next });
                  }}
                />
                <Input
                  placeholder="Player IGN"
                  value={w.player ?? ""}
                  onChange={(e) => {
                    const next = [...row.winners];
                    next[i] = { ...w, player: e.target.value };
                    update(row.id, { winners: next });
                  }}
                />
                <Input
                  placeholder="Category"
                  value={w.category ?? ""}
                  onChange={(e) => {
                    const next = [...row.winners];
                    next[i] = { ...w, category: e.target.value };
                    update(row.id, { winners: next });
                  }}
                />
                <Input
                  placeholder="Prize"
                  value={w.prize ?? ""}
                  onChange={(e) => {
                    const next = [...row.winners];
                    next[i] = { ...w, prize: e.target.value };
                    update(row.id, { winners: next });
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => update(row.id, { winners: row.winners.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Highlights</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => update(row.id, { highlights: [...row.highlights, { title: "", body: "" }] })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add highlight
              </Button>
            </div>
            {row.highlights.map((h, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_2fr_auto] items-center">
                <Input
                  placeholder="Title"
                  value={h.title ?? ""}
                  onChange={(e) => {
                    const next = [...row.highlights];
                    next[i] = { ...h, title: e.target.value };
                    update(row.id, { highlights: next });
                  }}
                />
                <Input
                  placeholder="Body"
                  value={h.body ?? ""}
                  onChange={(e) => {
                    const next = [...row.highlights];
                    next[i] = { ...h, body: e.target.value };
                    update(row.id, { highlights: next });
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => update(row.id, { highlights: row.highlights.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.published}
                  onCheckedChange={(v) => update(row.id, { published: v })}
                  id={`pub-${row.id}`}
                />
                <Label htmlFor={`pub-${row.id}`}>Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Order</Label>
                <Input
                  type="number"
                  className="w-20"
                  value={row.sort_order}
                  onChange={(e) => update(row.id, { sort_order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => remove(row)}>
                <Trash2 className="h-4 w-4 mr-1.5 text-destructive" /> Delete
              </Button>
              <Button onClick={() => save(row)} disabled={saving === row.id}>
                {saving === row.id ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1.5" />
                )}
                Save
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default SeasonsAdminSection;
