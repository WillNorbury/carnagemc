import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Sparkles } from "lucide-react";

type CreatorCode = {
  id: string;
  code: string;
  creator_name: string;
  discount_percent: number;
  active: boolean;
  max_uses: number | null;
  uses_count: number;
  notes: string | null;
  created_at: string;
};

const empty = {
  code: "",
  creator_name: "",
  discount_percent: "10",
  max_uses: "",
  notes: "",
};

export const CreatorCodesAdminSection = () => {
  const [rows, setRows] = useState<CreatorCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("creator_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as CreatorCode[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const code = form.code.trim().toUpperCase();
    const creator = form.creator_name.trim();
    const pct = Number(form.discount_percent);
    if (!code || !creator) return toast.error("Code and creator name are required.");
    if (!(pct > 0 && pct <= 100)) return toast.error("Discount must be between 1 and 100%.");
    setSaving(true);
    const { error } = await supabase.from("creator_codes").insert({
      code,
      creator_name: creator,
      discount_percent: pct,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Creator code created");
    setForm(empty);
    load();
  };

  const toggle = async (row: CreatorCode) => {
    const { error } = await supabase
      .from("creator_codes")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, active: !row.active } : x)));
  };

  const remove = async (row: CreatorCode) => {
    if (!confirm(`Delete creator code ${row.code}?`)) return;
    const { error } = await supabase.from("creator_codes").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    setRows((r) => r.filter((x) => x.id !== row.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" /> Creator Codes
        </h2>
        <p className="text-sm text-muted-foreground">
          Issue discount codes to content creators. Applies at store checkout as a percent off.
        </p>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <Label>Code *</Label>
            <Input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="CREATOR10"
              maxLength={32}
            />
          </div>
          <div>
            <Label>Creator name *</Label>
            <Input
              value={form.creator_name}
              onChange={(e) => setForm({ ...form, creator_name: e.target.value })}
              placeholder="Creator"
              maxLength={80}
            />
          </div>
          <div>
            <Label>Discount %</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
            />
          </div>
          <div>
            <Label>Max uses (optional)</Label>
            <Input
              type="number"
              min={1}
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              placeholder="∞"
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Optional"
              maxLength={200}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={create} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Add code
          </Button>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No creator codes yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Code</th>
                  <th className="text-left p-3">Creator</th>
                  <th className="text-left p-3">Discount</th>
                  <th className="text-left p-3">Uses</th>
                  <th className="text-left p-3">Active</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-mono font-bold">{r.code}</td>
                    <td className="p-3">{r.creator_name}</td>
                    <td className="p-3">{r.discount_percent}%</td>
                    <td className="p-3">
                      {r.uses_count}
                      {r.max_uses ? ` / ${r.max_uses}` : ""}
                    </td>
                    <td className="p-3">
                      <Switch checked={r.active} onCheckedChange={() => toggle(r)} />
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(r)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
