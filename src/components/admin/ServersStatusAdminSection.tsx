import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Save, RefreshCw } from "lucide-react";


type Row = {
  slug: string;
  name: string;
  ip: string | null;
  online: boolean;
  players_online: number;
  players_max: number;
  tps: number;
  uptime_pct: number;
  motd: string | null;
  sort_order: number;
  updated_at: string;
};

const empty = (): Row => ({
  slug: "",
  name: "",
  ip: "",
  online: false,
  players_online: 0,
  players_max: 100,
  tps: 20,
  uptime_pct: 100,
  motd: "",
  sort_order: 0,
  updated_at: new Date().toISOString(),
});

const ServersStatusAdminSection = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [creating, setCreating] = useState<Row | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("mc_public_servers")
      .select("*")
      .order("sort_order")
      .order("name");
    if (error) toast.error(error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = (slug: string, patch: Partial<Row>) =>
    setRows((r) => r.map((x) => (x.slug === slug ? { ...x, ...patch } : x)));

  const save = async (r: Row) => {
    setSavingSlug(r.slug);
    const { error } = await supabase
      .from("mc_public_servers")
      .update({
        name: r.name.trim(),
        ip: r.ip?.trim() || null,
        online: r.online,
        players_online: Number(r.players_online) || 0,
        players_max: Number(r.players_max) || 0,
        tps: Number(r.tps) || 0,
        uptime_pct: Number(r.uptime_pct) || 0,
        motd: r.motd?.trim() || null,
        sort_order: Number(r.sort_order) || 0,
      })
      .eq("slug", r.slug);
    setSavingSlug(null);
    if (error) return toast.error(error.message);
    toast.success(`${r.name} saved`);
    load();
  };

  const remove = async (r: Row) => {
    if (!confirm(`Delete server "${r.name}"?`)) return;
    const { error } = await supabase.from("mc_public_servers").delete().eq("slug", r.slug);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  const createRow = async () => {
    if (!creating) return;
    const slug = creating.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    if (!slug || !creating.name.trim()) return toast.error("Slug and name required");
    const { error } = await supabase.from("mc_public_servers").insert({
      slug,
      name: creating.name.trim(),
      ip: creating.ip?.trim() || null,
      online: creating.online,
      players_online: Number(creating.players_online) || 0,
      players_max: Number(creating.players_max) || 0,
      tps: Number(creating.tps) || 0,
      uptime_pct: Number(creating.uptime_pct) || 0,
      motd: creating.motd?.trim() || null,
      sort_order: Number(creating.sort_order) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Server added");
    setCreating(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Public /servers-status page reads these rows. TPS &amp; uptime are manual overrides.
        </p>
        <Button onClick={() => setCreating(empty())} disabled={!!creating}>
          <Plus className="h-4 w-4 mr-1" /> Add server
        </Button>
      </div>

      {creating && (
        <Card className="p-6 space-y-4 border-primary/40">
          <h3 className="font-bold">New server</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Slug (url key)</Label>
              <Input value={creating.slug} onChange={(e) => setCreating({ ...creating, slug: e.target.value })} placeholder="creative" />
            </div>
            <div>
              <Label>Display name</Label>
              <Input value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} placeholder="Creative (Dev)" />
            </div>
            <div>
              <Label>IP / connect string</Label>
              <Input value={creating.ip ?? ""} onChange={(e) => setCreating({ ...creating, ip: e.target.value })} placeholder="creative.carnagemc.net" />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input type="number" value={creating.sort_order} onChange={(e) => setCreating({ ...creating, sort_order: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreating(null)}>Cancel</Button>
            <Button onClick={createRow}>Create</Button>
          </div>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No servers yet.</Card>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.slug} className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant={r.online ? "default" : "outline"}>{r.online ? "Online" : "Offline"}</Badge>
                  <span className="font-bold">{r.name}</span>
                  <code className="text-xs text-muted-foreground">/{r.slug}</code>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Display name</Label>
                  <Input value={r.name} onChange={(e) => update(r.slug, { name: e.target.value })} />
                </div>
                <div>
                  <Label>IP / connect string</Label>
                  <Input value={r.ip ?? ""} onChange={(e) => update(r.slug, { ip: e.target.value })} />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input type="number" value={r.sort_order} onChange={(e) => update(r.slug, { sort_order: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Players online</Label>
                  <Input type="number" min={0} value={r.players_online} onChange={(e) => update(r.slug, { players_online: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Players max</Label>
                  <Input type="number" min={0} value={r.players_max} onChange={(e) => update(r.slug, { players_max: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>TPS (0–20)</Label>
                  <Input type="number" step="0.01" min={0} max={20} value={r.tps} onChange={(e) => update(r.slug, { tps: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Uptime % (30d)</Label>
                  <Input type="number" step="0.01" min={0} max={100} value={r.uptime_pct} onChange={(e) => update(r.slug, { uptime_pct: Number(e.target.value) })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={r.online} onCheckedChange={(v) => update(r.slug, { online: v })} />
                  <Label className="m-0">Online</Label>
                </div>
              </div>
              <div>
                <Label>MOTD / description</Label>
                <Textarea rows={2} value={r.motd ?? ""} onChange={(e) => update(r.slug, { motd: e.target.value })} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Last updated {new Date(r.updated_at).toLocaleString()}</span>
                <Button onClick={() => save(r)} disabled={savingSlug === r.slug}>
                  <Save className="h-4 w-4 mr-1" />
                  {savingSlug === r.slug ? "Saving…" : "Save"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServersStatusAdminSection;
