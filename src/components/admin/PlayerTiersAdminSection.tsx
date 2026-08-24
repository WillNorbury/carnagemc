import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2, Save, Search } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";

export type PlayerTier = {
  id: string;
  player_name: string;
  tier: string;
  category: string;
  region: string | null;
  points: number;
  notes: string | null;
  sort_order: number;
};

export const TIERS = [
  "HT5", "HT4", "HT3", "HT2", "HT1",
  "LT5", "LT4", "LT3", "LT2", "LT1",
];

export const PlayerTiersAdminSection = () => {
  const [rows, setRows] = useState<PlayerTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("player_tiers")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as PlayerTier[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (id: string, patch: Partial<PlayerTier>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const save = async (row: PlayerTier) => {
    setSaving(row.id);
    const { error } = await supabase
      .from("player_tiers")
      .update({
        player_name: row.player_name,
        tier: row.tier,
        category: row.category,
        region: row.region,
        points: row.points,
        notes: row.notes,
        sort_order: row.sort_order,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const remove = async (row: PlayerTier) => {
    const ok = await confirm({
      title: "Remove player?",
      description: `Remove "${row.player_name}" from the tier list?`,
      confirmText: "Remove",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("player_tiers").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      setRows((r) => r.filter((x) => x.id !== row.id));
    }
  };

  const add = async () => {
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { data, error } = await supabase
      .from("player_tiers")
      .insert({ player_name: "New player", tier: "B", category: "Overall", sort_order: maxOrder + 10 })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((r) => [...r, data as PlayerTier]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.player_name.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.tier.toLowerCase().includes(q)
    );
  }, [rows, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search players, tiers, categories…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button onClick={add} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add player
        </Button>
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No players on the tier list yet.</p>
      )}

      <div className="grid gap-4">
        {filtered.map((row) => (
          <Card key={row.id} className="p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Player name</Label>
                <Input
                  value={row.player_name}
                  onChange={(e) => update(row.id, { player_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Category / kit</Label>
                <Input
                  value={row.category}
                  placeholder="Overall, Sword, Crystal…"
                  onChange={(e) => update(row.id, { category: e.target.value })}
                />
              </div>
              <div>
                <Label>Tier</Label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {TIERS.map((t) => (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={row.tier === t ? "default" : "outline"}
                      onClick={() => update(row.id, { tier: t })}
                    >
                      {t}
                    </Button>
                  ))}
                  <Input
                    className="w-24"
                    value={row.tier}
                    onChange={(e) => update(row.id, { tier: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Region</Label>
                  <Input
                    value={row.region ?? ""}
                    placeholder="NA / EU / AU"
                    onChange={(e) => update(row.id, { region: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Points</Label>
                  <Input
                    type="number"
                    value={row.points}
                    onChange={(e) => update(row.id, { points: parseInt(e.target.value || "0", 10) })}
                  />
                </div>
                <div>
                  <Label>Order</Label>
                  <Input
                    type="number"
                    value={row.sort_order}
                    onChange={(e) => update(row.id, { sort_order: parseInt(e.target.value || "0", 10) })}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  rows={2}
                  value={row.notes ?? ""}
                  onChange={(e) => update(row.id, { notes: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="destructive" size="sm" onClick={() => remove(row)}>
                <Trash2 className="h-4 w-4 mr-1" /> Remove
              </Button>
              <Button size="sm" onClick={() => save(row)} disabled={saving === row.id}>
                {saving === row.id ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlayerTiersAdminSection;
