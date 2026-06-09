import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export type CustomRole = {
  key: string;
  label: string;
  emoji: string;
  color: string;
  rank: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export const CustomRolesManager = ({
  onChanged,
}: {
  onChanged?: () => void;
}) => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("custom_roles")
      .select("key,label,emoji,color,rank")
      .order("rank", { ascending: true });
    if (error) toast.error(error.message);
    setRoles((data ?? []) as CustomRole[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing({ key: "", label: "", emoji: "⭐", color: "#9ca3af", rank: 100 });
    setOpen(true);
  };

  const openEdit = (r: CustomRole) => {
    setEditing({ ...r });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    const label = editing.label.trim();
    if (!label) return toast.error("Label is required");
    const key = (editing.key || slugify(label)).trim();
    if (!key) return toast.error("Key is required");
    if (!/^[a-z0-9_]+$/.test(key))
      return toast.error("Key must be lowercase letters, numbers, underscores");

    const exists = roles.find((r) => r.key === key);
    const payload = {
      key,
      label,
      emoji: editing.emoji || "⭐",
      color: editing.color || "#9ca3af",
      rank: Number.isFinite(editing.rank) ? editing.rank : 100,
    };

    const { error } = exists
      ? await supabase.from("custom_roles").update(payload).eq("key", key)
      : await supabase.from("custom_roles").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(exists ? "Role updated" : "Role created");
    setOpen(false);
    setEditing(null);
    await load();
    onChanged?.();
  };

  const remove = async (key: string) => {
    if (!confirm(`Delete custom role "${key}"? This will also remove it from any user it's assigned to.`))
      return;
    const { error } = await supabase.from("custom_roles").delete().eq("key", key);
    if (error) return toast.error(error.message);
    toast.success("Role deleted");
    await load();
    onChanged?.();
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Custom roles</div>
          <div className="text-xs text-muted-foreground">
            Create your own roles. They show up in the role picker alongside built-in roles.
          </div>
        </div>
        <Button size="sm" onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New role
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : roles.length === 0 ? (
        <div className="text-sm text-muted-foreground">No custom roles yet.</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => (
            <div
              key={r.key}
              className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 pl-2 pr-1 py-1"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: r.color }}
              />
              <span className="text-sm">
                {r.emoji} {r.label}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {r.key}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => openEdit(r)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => remove(r.key)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing && roles.find((r) => r.key === editing.key)
                ? "Edit custom role"
                : "Create custom role"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Label</Label>
                  <Input
                    value={editing.label}
                    onChange={(e) =>
                      setEditing({ ...editing, label: e.target.value })
                    }
                    placeholder="VIP"
                  />
                </div>
                <div>
                  <Label>
                    Key{" "}
                    <span className="text-xs text-muted-foreground">
                      (lowercase, no spaces)
                    </span>
                  </Label>
                  <Input
                    value={editing.key}
                    onChange={(e) =>
                      setEditing({ ...editing, key: e.target.value })
                    }
                    placeholder={slugify(editing.label) || "vip"}
                    disabled={!!roles.find((r) => r.key === editing.key)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={editing.emoji}
                    onChange={(e) =>
                      setEditing({ ...editing, emoji: e.target.value })
                    }
                    placeholder="⭐"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input
                    type="color"
                    value={editing.color}
                    onChange={(e) =>
                      setEditing({ ...editing, color: e.target.value })
                    }
                    className="h-10 p-1"
                  />
                </div>
                <div>
                  <Label>Rank</Label>
                  <Input
                    type="number"
                    value={editing.rank}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        rank: parseInt(e.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
