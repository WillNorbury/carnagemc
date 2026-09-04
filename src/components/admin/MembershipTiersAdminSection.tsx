import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Save, Trash2, Crown } from "lucide-react";
import { confirm } from "@/lib/confirm";

type Tier = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  price_monthly: number | null;
  price_lifetime: number | null;
  currency: string;
  color: string;
  badge_label: string | null;
  perks: string[];
  sort_order: number;
  featured: boolean;
  published: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "tier";

export function MembershipTiersAdminSection() {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);

  const load = async () => {
    const { data, error } = await supabase
      .from("membership_tiers")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast({ title: "Failed to load tiers", description: error.message, variant: "destructive" });
    setTiers(((data ?? []) as unknown as Tier[]));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const patch = (id: string, changes: Partial<Tier>) =>
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, ...changes } : t)));

  const save = async (tier: Tier) => {
    setSavingId(tier.id);
    const { error } = await supabase
      .from("membership_tiers")
      .update({
        name: tier.name,
        slug: slugify(tier.slug || tier.name),
        tagline: tier.tagline,
        description: tier.description,
        price_monthly: tier.price_monthly,
        price_lifetime: tier.price_lifetime,
        currency: tier.currency || "USD",
        color: tier.color || "#0082A2",
        badge_label: tier.badge_label,
        perks: tier.perks,
        sort_order: tier.sort_order,
        featured: tier.featured,
        published: tier.published,
      })
      .eq("id", tier.id);
    setSavingId(null);
    if (error) toast({ title: "Save failed", description: error.message, variant: "destructive" });
    else toast({ title: "Saved", description: `${tier.name} updated.` });
  };

  const create = async () => {
    const { data, error } = await supabase
      .from("membership_tiers")
      .insert({
        name: "New tier",
        slug: `tier-${Date.now()}`,
        perks: [],
        sort_order: tiers.length + 1,
        published: false,
      })
      .select("*")
      .single();
    if (error) {
      toast({ title: "Create failed", description: error.message, variant: "destructive" });
      return;
    }
    setTiers((prev) => [...prev, data as unknown as Tier]);
  };

  const remove = async (tier: Tier) => {
    const ok = await confirm({
      title: `Delete ${tier.name}?`,
      description: "This membership tier will be removed from the store and dashboard.",
      confirmText: "Delete",
      destructive: true,
    });
    if (!ok) return;
    const { error } = await supabase.from("membership_tiers").delete().eq("id", tier.id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else setTiers((prev) => prev.filter((t) => t.id !== tier.id));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading membership tiers…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Tiers published here appear on the store and on the member dashboard.
        </p>
        <Button onClick={() => void create()}>
          <Plus className="h-4 w-4" /> New tier
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {tiers.map((tier) => (
          <Card key={tier.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-4 w-4" style={{ color: tier.color }} /> {tier.name}
              </CardTitle>
              <CardDescription>/{tier.slug}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={tier.name} onChange={(e) => patch(tier.id, { name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug</Label>
                  <Input value={tier.slug} onChange={(e) => patch(tier.id, { slug: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Monthly price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tier.price_monthly ?? ""}
                    onChange={(e) =>
                      patch(tier.id, { price_monthly: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Lifetime price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={tier.price_lifetime ?? ""}
                    onChange={(e) =>
                      patch(tier.id, { price_lifetime: e.target.value === "" ? null : Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Currency</Label>
                  <Input value={tier.currency} onChange={(e) => patch(tier.id, { currency: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Badge label</Label>
                  <Input
                    value={tier.badge_label ?? ""}
                    onChange={(e) => patch(tier.id, { badge_label: e.target.value || null })}
                    placeholder="Popular"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Accent color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(tier.color) ? tier.color : "#0082A2"}
                      onChange={(e) => patch(tier.id, { color: e.target.value })}
                      className="h-10 w-14 cursor-pointer rounded border border-border bg-background"
                    />
                    <Input value={tier.color} onChange={(e) => patch(tier.id, { color: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={tier.sort_order}
                    onChange={(e) => patch(tier.id, { sort_order: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Tagline</Label>
                <Input
                  value={tier.tagline ?? ""}
                  onChange={(e) => patch(tier.id, { tagline: e.target.value || null })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={tier.description ?? ""}
                  onChange={(e) => patch(tier.id, { description: e.target.value || null })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Perks (one per line)</Label>
                <Textarea
                  rows={5}
                  value={(tier.perks ?? []).join("\n")}
                  onChange={(e) =>
                    patch(tier.id, { perks: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean) })
                  }
                />
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={tier.published} onCheckedChange={(v) => patch(tier.id, { published: v })} />
                  <Label>Published</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={tier.featured} onCheckedChange={(v) => patch(tier.id, { featured: v })} />
                  <Label>Featured</Label>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={() => void save(tier)} disabled={savingId === tier.id}>
                  {savingId === tier.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save
                </Button>
                <Button variant="destructive" onClick={() => void remove(tier)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
