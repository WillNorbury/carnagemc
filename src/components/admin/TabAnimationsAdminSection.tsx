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
import { parseMcText } from "@/lib/mcColors";

type Row = {
  id: string;
  name: string;
  change_interval: number;
  lines: string[];
  sort_order: number;
  published: boolean;
};

export const TabAnimationsAdminSection = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    // Admins need ALL rows (incl. unpublished) — query without the published
    // filter; the admin select policy allows it.
    const { data, error } = await (supabase.from("tab_animations" as any) as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    else
      setRows(
        ((data ?? []) as any[]).map((r) => ({
          ...r,
          lines: Array.isArray(r.lines) ? r.lines : [],
        })) as Row[],
      );
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const patch = (id: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const add = async () => {
    const { data, error } = await (supabase.from("tab_animations" as any) as any)
      .insert({ name: "New Group", change_interval: 2500, lines: [], sort_order: rows.length })
      .select()
      .single();
    if (error) toast.error(error.message);
    else {
      toast.success("Group added");
      load();
    }
  };

  const save = async (r: Row) => {
    setSaving(r.id);
    const { error } = await (supabase.from("tab_animations" as any) as any)
      .update({
        name: r.name,
        change_interval: Math.max(250, Number(r.change_interval) || 2500),
        lines: r.lines,
        sort_order: r.sort_order,
        published: r.published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
    setSaving(null);
    if (error) toast.error(error.message);
    else toast.success(`Saved "${r.name}"`);
  };

  const remove = async (r: Row) => {
    if (!(await confirm({ title: `Delete "${r.name}"?`, description: "This removes the animation group.", confirmText: "Delete", destructive: true }))) return;
    const { error } = await (supabase.from("tab_animations" as any) as any).delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setRows((rs) => rs.filter((x) => x.id !== r.id));
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tab Animations</h2>
          <p className="text-sm text-muted-foreground">
            Animated lines shown on /tab. One text frame per line; supports &amp; codes and &lt;#hex&gt; colors.
          </p>
        </div>
        <Button onClick={add} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Group
        </Button>
      </div>

      {rows.map((r) => (
        <Card key={r.id} className="p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Name</Label>
              <Input value={r.name} onChange={(e) => patch(r.id, { name: e.target.value })} />
            </div>
            <div>
              <Label>Change interval (ms)</Label>
              <Input
                type="number"
                min={250}
                step={100}
                value={r.change_interval}
                onChange={(e) => patch(r.id, { change_interval: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={r.sort_order}
                onChange={(e) => patch(r.id, { sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Text frames (one per line, cycled in order)</Label>
            <Textarea
              rows={Math.min(8, Math.max(2, r.lines.length + 1))}
              className="font-mono text-xs"
              value={r.lines.join("\n")}
              onChange={(e) => patch(r.id, { lines: e.target.value.split("\n") })}
              placeholder={'<#00748c>&lDISCORD &8• &fdiscord.warden.rip'}
            />
          </div>

          {/* Preview of first frame */}
          <div className="rounded bg-black/80 px-3 py-2 font-mono text-sm">
            {parseMcText(r.lines[0] ?? "", `${r.id}-preview-`) || <span className="text-muted-foreground">(empty)</span>}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={r.published} onCheckedChange={(v) => patch(r.id, { published: v })} />
              Published
            </label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => save(r)} disabled={saving === r.id}>
                {saving === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
              <Button size="sm" variant="destructive" onClick={() => remove(r)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
