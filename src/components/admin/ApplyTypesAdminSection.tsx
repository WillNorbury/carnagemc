import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { confirm } from "@/lib/confirm";
import { logEvent } from "@/lib/logEvent";
import type { ApplicationType } from "@/pages/Apply";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const blank = (): Partial<ApplicationType> => ({
  slug: "",
  label: "",
  description: "",
  icon: "ClipboardList",
  color: "primary",
  sort_order: 0,
  enabled: true,
  accepting: true,
  requires_portfolio: false,
  portfolio_label: "",
  intro: "",
});

export const ApplyTypesAdminSection = () => {
  const [items, setItems] = useState<ApplicationType[] | null>(null);
  const [editing, setEditing] = useState<Partial<ApplicationType> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("application_types" as any)
      .select("*")
      .order("sort_order", { ascending: true });
    setItems(((data ?? []) as unknown) as ApplicationType[]);
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => setEditing(blank());
  const openEdit = (t: ApplicationType) => setEditing({ ...t });

  const save = async () => {
    if (!editing) return;
    const slug = (editing.slug || slugify(editing.label || "")).trim();
    if (!slug || !editing.label?.trim()) {
      toast.error("Slug and label are required.");
      return;
    }
    setSaving(true);
    const payload = {
      slug,
      label: editing.label!.trim(),
      description: editing.description?.trim() ?? "",
      icon: editing.icon?.trim() || "ClipboardList",
      color: editing.color?.trim() || "primary",
      sort_order: editing.sort_order ?? 0,
      enabled: editing.enabled ?? true,
      accepting: editing.accepting ?? true,
      requires_portfolio: editing.requires_portfolio ?? false,
      portfolio_label: editing.portfolio_label?.trim() || null,
      intro: editing.intro?.trim() || null,
    };

    const isNew = !editing.id;
    const { error } = isNew
      ? await supabase.from("application_types" as any).insert(payload)
      : await supabase.from("application_types" as any).update(payload).eq("id", editing.id!);

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? "Application type created" : "Application type updated");
    logEvent({
      title: isNew ? "Application type created" : "Application type updated",
      description: `${payload.label} (${payload.slug})`,
      color: 0x4f46e5,
    }).catch(() => {});
    setEditing(null);
    load();
  };

  const remove = async (t: ApplicationType) => {
    const ok = await confirm({
      title: `Delete ${t.label}?`,
      description: "Existing submissions for this type will remain, but the type will no longer appear on /apply.",
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("application_types" as any).delete().eq("id", t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    logEvent({
      title: "Application type deleted",
      description: `${t.label} (${t.slug})`,
      color: 0xdc2626,
    }).catch(() => {});
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Types listed here appear on <code className="px-1 rounded bg-muted">/apply</code> and as forms at{" "}
          <code className="px-1 rounded bg-muted">/apply/:slug</code>.
        </p>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> New type
        </Button>
      </div>

      {!items && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {items && items.length === 0 && (
        <Card className="p-10 text-center text-muted-foreground">
          No application types yet — create one to start accepting applications.
        </Card>
      )}

      <div className="grid gap-3">
        {items?.map((t) => (
          <Card key={t.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-bold">{t.label}</span>
                <code className="text-xs text-muted-foreground">/apply/{t.slug}</code>
                {!t.enabled && <Badge variant="outline">Hidden</Badge>}
                {t.enabled && !t.accepting && <Badge variant="outline">Closed</Badge>}
                {t.requires_portfolio && <Badge variant="secondary">Portfolio</Badge>}
              </div>
              {t.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(t)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit application type" : "New application type"}</DialogTitle>
            <DialogDescription>
              Shown on the public Apply page. Slug must be URL-safe.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="label">Label *</Label>
                  <Input
                    id="label"
                    value={editing.label ?? ""}
                    onChange={(e) =>
                      setEditing((p) => ({
                        ...p!,
                        label: e.target.value,
                        slug: p!.id ? p!.slug : slugify(e.target.value),
                      }))
                    }
                    placeholder="Staff"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={editing.slug ?? ""}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p!, slug: slugify(e.target.value) }))
                    }
                    placeholder="staff"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="desc">Short description</Label>
                <Textarea
                  id="desc"
                  rows={2}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p!, description: e.target.value }))}
                  placeholder="Shown on the application card."
                />
              </div>
              <div>
                <Label htmlFor="intro">Intro (form page)</Label>
                <Textarea
                  id="intro"
                  rows={2}
                  value={editing.intro ?? ""}
                  onChange={(e) => setEditing((p) => ({ ...p!, intro: e.target.value }))}
                  placeholder="Optional longer intro shown above the form."
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="icon">Icon (lucide)</Label>
                  <Input
                    id="icon"
                    value={editing.icon ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, icon: e.target.value }))}
                    placeholder="ShieldCheck"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={editing.color ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, color: e.target.value }))}
                    placeholder="primary"
                  />
                </div>
                <div>
                  <Label htmlFor="sort">Sort order</Label>
                  <Input
                    id="sort"
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) =>
                      setEditing((p) => ({ ...p!, sort_order: parseInt(e.target.value || "0", 10) }))
                    }
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between gap-3 p-3 rounded-md border">
                  <div>
                    <div className="font-medium text-sm">Visible</div>
                    <div className="text-xs text-muted-foreground">Show on /apply</div>
                  </div>
                  <Switch
                    checked={editing.enabled ?? true}
                    onCheckedChange={(v) => setEditing((p) => ({ ...p!, enabled: v }))}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 p-3 rounded-md border">
                  <div>
                    <div className="font-medium text-sm">Accepting</div>
                    <div className="text-xs text-muted-foreground">Allow new submissions</div>
                  </div>
                  <Switch
                    checked={editing.accepting ?? true}
                    onCheckedChange={(v) => setEditing((p) => ({ ...p!, accepting: v }))}
                  />
                </label>
              </div>
              <label className="flex items-center justify-between gap-3 p-3 rounded-md border">
                <div>
                  <div className="font-medium text-sm">Require portfolio link</div>
                  <div className="text-xs text-muted-foreground">For builders, creators, etc.</div>
                </div>
                <Switch
                  checked={editing.requires_portfolio ?? false}
                  onCheckedChange={(v) => setEditing((p) => ({ ...p!, requires_portfolio: v }))}
                />
              </label>
              {editing.requires_portfolio && (
                <div>
                  <Label htmlFor="plabel">Portfolio field label</Label>
                  <Input
                    id="plabel"
                    value={editing.portfolio_label ?? ""}
                    onChange={(e) => setEditing((p) => ({ ...p!, portfolio_label: e.target.value }))}
                    placeholder="Portfolio URL (Imgur, Planet Minecraft, etc.)"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
