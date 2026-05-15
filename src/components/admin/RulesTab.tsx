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

type RuleSection = {
  id: string;
  icon: string;
  title: string;
  items: string[];
  sort_order: number;
  published: boolean;
};

const emptyDraft = (sort_order = 0): Omit<RuleSection, "id"> => ({
  icon: "ShieldCheck",
  title: "",
  items: [],
  sort_order,
  published: true,
});

export const RulesTab = () => {
  const [rows, setRows] = useState<RuleSection[]>([]);
  const [editing, setEditing] = useState<RuleSection | (Omit<RuleSection, "id"> & { id?: string }) | null>(null);
  const [itemsText, setItemsText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("rule_sections").select("*").order("sort_order", { ascending: true });
    setRows((data ?? []) as RuleSection[]);
  };
  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    const next = (rows[rows.length - 1]?.sort_order ?? 0) + 10;
    setEditing(emptyDraft(next));
    setItemsText("");
  };

  const startEdit = (r: RuleSection) => {
    setEditing(r);
    setItemsText(r.items.join("\n"));
  };

  const cancel = () => {
    setEditing(null);
    setItemsText("");
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      icon: editing.icon,
      title: editing.title.trim(),
      items: itemsText.split("\n").map((s) => s.trim()).filter(Boolean),
      sort_order: editing.sort_order,
      published: editing.published,
    };
    setSaving(true);
    try {
      if ("id" in editing && editing.id) {
        const { error } = await supabase.from("rule_sections").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Section updated");
      } else {
        const { error } = await supabase.from("rule_sections").insert(payload);
        if (error) throw error;
        toast.success("Section created");
      }
      // Best-effort resync to Discord
      supabase.functions.invoke("discord-bot-action", { body: { action: "rules" } }).then(({ data, error }) => {
        if (error || (data as any)?.ok === false) return;
        toast.success("Discord rules message updated");
      });
      cancel();
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: RuleSection) => {
    const ok = await confirm({
      title: "Delete section?",
      description: `This will remove "${r.title}" from the Rules page.`,
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("rule_sections").delete().eq("id", r.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Section deleted");
    load();
  };

  const move = async (r: RuleSection, dir: -1 | 1) => {
    const idx = rows.findIndex((x) => x.id === r.id);
    const swap = rows[idx + dir];
    if (!swap) return;
    await supabase.from("rule_sections").update({ sort_order: swap.sort_order }).eq("id", r.id);
    await supabase.from("rule_sections").update({ sort_order: r.sort_order }).eq("id", swap.id);
    load();
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold">Rule sections</h2>
            <p className="text-xs text-muted-foreground">Edits show instantly on /rules.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const t = toast.loading("Syncing to Discord…");
                const { data, error } = await supabase.functions.invoke("discord-bot-action", { body: { action: "rules" } });
                toast.dismiss(t);
                if (error || (data as any)?.ok === false) toast.error((data as any)?.error || error?.message || "Sync failed");
                else toast.success("Discord rules synced");
              }}
            >
              Sync to Discord
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const t = toast.loading("Registering /rules…");
                const { data, error } = await supabase.functions.invoke("discord-register-commands", { body: {} });
                toast.dismiss(t);
                if (error || (data as any)?.ok === false) toast.error((data as any)?.error || error?.message || "Registration failed");
                else toast.success("/rules slash command registered (may take up to 1h to appear)");
              }}
            >
              Register /rules
            </Button>
            <Button onClick={startNew} size="sm">
              <Plus className="h-4 w-4 mr-1" /> New section
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No rule sections yet.</p>
          )}
          {rows.map((r, i) => {
            const Icon = getIcon(r.icon);
            return (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card/50">
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
                  <div className="text-xs text-muted-foreground truncate">{r.items.length} item{r.items.length === 1 ? "" : "s"}</div>
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
            <h3 className="font-bold">{"id" in editing && editing.id ? "Edit section" : "New section"}</h3>
            <Switch
              checked={editing.published}
              onCheckedChange={(v) => setEditing({ ...editing, published: v })}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="General Rules"
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
            <Label>Items (one per line)</Label>
            <Textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              rows={6}
              placeholder={"Be respectful to all players and staff members.\nNo harassment, bullying, or toxic behavior."}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={cancel}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save section"}</Button>
          </div>
        </Card>
      )}
    </div>
  );
};
