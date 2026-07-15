import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";

type VoteLink = {
  id: string;
  site_key: string;
  name: string;
  url: string;
  reward: string;
  sort_order: number;
  enabled: boolean;
};

export const VoteLinksAdminSection = () => {
  const [rows, setRows] = useState<VoteLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("vote_links")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as VoteLink[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<VoteLink>) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const save = async (row: VoteLink) => {
    setSaving(row.id);
    const { error } = await supabase
      .from("vote_links")
      .update({
        site_key: row.site_key,
        name: row.name,
        url: row.url,
        reward: row.reward,
        sort_order: row.sort_order,
        enabled: row.enabled,
      })
      .eq("id", row.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  };

  const remove = async (row: VoteLink) => {
    const ok = await confirm({
      title: "Delete vote link?",
      description: `Remove "${row.name}" from /vote?`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("vote_links").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setRows((r) => r.filter((x) => x.id !== row.id));
    }
  };

  const add = async () => {
    const key = `site-${Date.now()}`;
    const maxOrder = rows.reduce((m, r) => Math.max(m, r.sort_order), 0);
    const { data, error } = await supabase
      .from("vote_links")
      .insert({
        site_key: key,
        name: "New Vote Site",
        url: "https://",
        reward: "1 Vote Crate Key",
        sort_order: maxOrder + 10,
        enabled: true,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setRows((r) => [...r, data as VoteLink]);
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
        <Button onClick={add} size="sm"><Plus className="h-4 w-4 mr-1" /> Add site</Button>
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No vote sites yet.</p>
      )}
      <div className="grid gap-4">
        {rows.map((row) => (
          <Card key={row.id} className="p-4 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>Name</Label>
                <Input value={row.name} onChange={(e) => update(row.id, { name: e.target.value })} />
              </div>
              <div>
                <Label>Site key (unique)</Label>
                <Input value={row.site_key} onChange={(e) => update(row.id, { site_key: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <Label>URL</Label>
                <div className="flex gap-2">
                  <Input value={row.url} onChange={(e) => update(row.id, { url: e.target.value })} />
                  <Button variant="outline" size="icon" asChild>
                    <a href={row.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
              <div>
                <Label>Reward</Label>
                <Input value={row.reward} onChange={(e) => update(row.id, { reward: e.target.value })} />
              </div>
              <div>
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={row.sort_order}
                  onChange={(e) => update(row.id, { sort_order: parseInt(e.target.value || "0", 10) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={row.enabled} onCheckedChange={(v) => update(row.id, { enabled: v })} />
                <span className="text-sm text-muted-foreground">{row.enabled ? "Enabled" : "Hidden"}</span>
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

export default VoteLinksAdminSection;
