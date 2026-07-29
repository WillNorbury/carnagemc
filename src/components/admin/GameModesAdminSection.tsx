import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";
import type { GameMode } from "@/lib/gameModes";

const toList = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

export const GameModesAdminSection = () => {
  const [rows, setRows] = useState<GameMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("game_modes")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as GameMode[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (id: string, patch: Partial<GameMode>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = async (row: GameMode) => {
    setSaving(row.id);
    const { error } = await supabase
      .from("game_modes")
      .update({
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        description: row.description,
        long_description: row.long_description,
        banner_url: row.banner_url || null,
        icon: row.icon,
        features: row.features,
        screenshots: row.screenshots,
        server_ip: row.server_ip,
        status: row.status,
        sort_order: row.sort_order,
        published: row.published,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const remove = async (row: GameMode) => {
    const ok = await confirm({
      title: "Delete game mode?",
      description: `Remove "${row.name}" from /gamemodes?`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("game_modes").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setRows((r) => r.filter((x) => x.id !== row.id));
    }
  };

  const add = async () => {
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { data, error } = await supabase
      .from("game_modes")
      .insert({
        slug: `mode-${Date.now()}`,
        name: "New Game Mode",
        tagline: "",
        description: "",
        icon: "Swords",
        status: "soon",
        sort_order: maxOrder + 10,
        published: false,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((r) => [...r, data as GameMode]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={add} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add game mode
        </Button>
      </div>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No game modes yet.</p>}
      <div className="grid gap-4">
        {rows.map((row) => (
          <Card key={row.id} className="p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={row.name} onChange={(e) => update(row.id, { name: e.target.value })} />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <div className="flex gap-2">
                  <Input value={row.slug} onChange={(e) => update(row.id, { slug: e.target.value })} />
                  <Button variant="outline" size="icon" asChild>
                    <a href={`/gamemodes/${row.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Tagline</Label>
                <Input
                  value={row.tagline ?? ""}
                  onChange={(e) => update(row.id, { tagline: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Short description (cards & SEO)</Label>
                <Textarea
                  rows={2}
                  value={row.description ?? ""}
                  onChange={(e) => update(row.id, { description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Full description (Markdown)</Label>
                <Textarea
                  rows={6}
                  className="font-mono text-xs"
                  value={row.long_description ?? ""}
                  onChange={(e) => update(row.id, { long_description: e.target.value })}
                />
              </div>
              <div>
                <Label>Features (one per line)</Label>
                <Textarea
                  rows={5}
                  value={row.features.join("\n")}
                  onChange={(e) => update(row.id, { features: toList(e.target.value) })}
                />
              </div>
              <div>
                <Label>Screenshot URLs (one per line)</Label>
                <Textarea
                  rows={5}
                  className="font-mono text-xs"
                  value={row.screenshots.join("\n")}
                  onChange={(e) => update(row.id, { screenshots: toList(e.target.value) })}
                />
              </div>
              <div>
                <Label>Banner image URL</Label>
                <Input
                  value={row.banner_url ?? ""}
                  onChange={(e) => update(row.id, { banner_url: e.target.value })}
                />
              </div>
              <div>
                <Label>Server IP</Label>
                <Input
                  value={row.server_ip ?? ""}
                  onChange={(e) => update(row.id, { server_ip: e.target.value })}
                />
              </div>
              <div>
                <Label>Lucide icon name</Label>
                <Input value={row.icon} onChange={(e) => update(row.id, { icon: e.target.value })} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={row.status} onValueChange={(v) => update(row.id, { status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="beta">Beta</SelectItem>
                    <SelectItem value="soon">Coming soon</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={row.sort_order}
                  onChange={(e) =>
                    update(row.id, { sort_order: parseInt(e.target.value || "0", 10) })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Switch
                  checked={row.published}
                  onCheckedChange={(v) => update(row.id, { published: v })}
                />
                <span className="text-sm text-muted-foreground">
                  {row.published ? "Published" : "Hidden"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => remove(row)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
                <Button size="sm" onClick={() => save(row)} disabled={saving === row.id}>
                  {saving === row.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameModesAdminSection;
