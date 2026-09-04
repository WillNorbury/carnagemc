import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import { confirm } from "@/lib/confirm";
import {
  emptyStoreSale,
  fetchStoreSale,
  isStoreSaleLive,
  saveStoreSale,
  type StoreSale,
} from "@/lib/storeSale";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  published: boolean;
};

type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  badge: string | null;
  featured: boolean;
  external_url: string | null;
  sort_order: number;
  published: boolean;
  perks: string[] | null;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const emptyCat: Omit<Category, "id"> = {
  slug: "",
  name: "",
  description: "",
  icon: "Package",
  sort_order: 0,
  published: true,
};

const emptyItem: Omit<Item, "id"> = {
  category_id: "",
  name: "",
  description: "",
  price: 0,
  currency: "USD",
  image_url: "",
  badge: "",
  featured: false,
  external_url: "",
  sort_order: 0,
  published: true,
  perks: [],
};

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string | null;
  min_subtotal: number;
  max_uses: number | null;
  uses_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  public_listed: boolean;
};

const emptyCoupon: Omit<Coupon, "id" | "uses_count"> = {
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: 10,
  currency: "USD",
  min_subtotal: 0,
  max_uses: null,
  starts_at: null,
  expires_at: null,
  active: true,
  public_listed: false,
};

const ICON_OPTIONS = ["Package", "Sparkles", "Zap", "Coins", "Award", "Flame", "Star", "ShoppingBag"];

export function StoreAdminSection() {
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [tab, setTab] = useState<"items" | "categories" | "coupons" | "sale">("items");
  const [storeSale, setStoreSale] = useState<StoreSale>(emptyStoreSale);
  const [savingStoreSale, setSavingStoreSale] = useState(false);

  useEffect(() => {
    fetchStoreSale().then((s) => setStoreSale(s ?? emptyStoreSale));
  }, []);
  const [editingCat, setEditingCat] = useState<
    Category | (Omit<Category, "id"> & { id?: string }) | null
  >(null);
  const [editingItem, setEditingItem] = useState<
    Item | (Omit<Item, "id"> & { id?: string }) | null
  >(null);
  const [editingCoupon, setEditingCoupon] = useState<
    Coupon | (Omit<Coupon, "id" | "uses_count"> & { id?: string; uses_count?: number }) | null
  >(null);

  async function load() {
    const [{ data: c }, { data: i }, { data: cp }] = await Promise.all([
      supabase.from("store_categories").select("*").order("sort_order").order("name"),
      supabase.from("store_items").select("*").order("sort_order").order("name"),
      supabase.from("store_coupons").select("*").order("created_at", { ascending: false }),
    ]);
    setCats((c as Category[]) ?? []);
    setItems((i as Item[]) ?? []);
    setCoupons((cp as Coupon[]) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveCoupon() {
    if (!editingCoupon) return;
    const cp = editingCoupon;
    const code = cp.code.trim().toUpperCase();
    if (!code) return toast.error("Code required");
    const value = Number(cp.discount_value);
    if (!(value >= 0)) return toast.error("Discount value must be ≥ 0");
    if (cp.discount_type === "percent" && value > 100)
      return toast.error("Percent must be ≤ 100");
    const payload = {
      code,
      description: cp.description || null,
      discount_type: cp.discount_type,
      discount_value: value,
      currency: (cp.currency || "USD").toUpperCase(),
      min_subtotal: Number(cp.min_subtotal) || 0,
      max_uses: cp.max_uses == null || cp.max_uses === ("" as any) ? null : Number(cp.max_uses),
      starts_at: cp.starts_at || null,
      expires_at: cp.expires_at || null,
      active: !!cp.active,
      public_listed: !!cp.public_listed,
    };
    if ("id" in cp && cp.id) {
      const { error } = await supabase.from("store_coupons").update(payload).eq("id", cp.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("store_coupons").insert([payload]);
      if (error) return toast.error(error.message);
    }
    toast.success("Coupon saved");
    setEditingCoupon(null);
    load();
  }

  async function removeCoupon(cp: Coupon) {
    if (!(await confirm(`Delete coupon "${cp.code}"?`))) return;
    const { error } = await supabase.from("store_coupons").delete().eq("id", cp.id);
    if (error) return toast.error(error.message);
    load();
  }


  async function saveCat() {
    if (!editingCat) return;
    const c = editingCat;
    if (!c.name.trim()) return toast.error("Name required");
    const slug = c.slug.trim() || slugify(c.name);
    const payload = {
      name: c.name.trim(),
      slug,
      description: c.description || null,
      icon: c.icon || null,
      sort_order: c.sort_order ?? 0,
      published: c.published,
    };
    if ("id" in c && c.id) {
      const { error } = await supabase.from("store_categories").update(payload).eq("id", c.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("store_categories").insert([payload]);
      if (error) return toast.error(error.message);
    }
    toast.success("Category saved");
    setEditingCat(null);
    load();
  }

  async function removeCat(c: Category) {
    if (!(await confirm(`Delete category "${c.name}"? Items in it must be deleted or reassigned first.`)))
      return;
    const { error } = await supabase.from("store_categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function saveItem() {
    if (!editingItem) return;
    const it = editingItem;
    if (!it.name.trim()) return toast.error("Name required");
    if (!it.category_id) return toast.error("Category required");
    const payload = {
      category_id: it.category_id,
      name: it.name.trim(),
      description: it.description || null,
      price: it.price == null || Number.isNaN(Number(it.price)) ? null : Number(it.price),
      currency: (it.currency || "USD").toUpperCase(),
      image_url: it.image_url || null,
      badge: it.badge || null,
      featured: !!it.featured,
      external_url: it.external_url || null,
      sort_order: it.sort_order ?? 0,
      published: !!it.published,
      perks: it.perks ?? [],
    };
    if ("id" in it && it.id) {
      const { error } = await supabase.from("store_items").update(payload).eq("id", it.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("store_items").insert([payload]);
      if (error) return toast.error(error.message);
    }
    toast.success("Item saved");
    setEditingItem(null);
    load();
  }

  async function removeItem(it: Item) {
    if (!(await confirm(`Delete "${it.name}"?`))) return;
    const { error } = await supabase.from("store_items").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    load();
  }

  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "—";

  const now = new Date();
  const liveSale =
    coupons.find(
      (cp) =>
        cp.public_listed &&
        cp.active &&
        !(cp.expires_at && new Date(cp.expires_at) < now) &&
        !(cp.max_uses != null && cp.uses_count >= cp.max_uses)
    ) ?? null;

  async function persistStoreSale(next: StoreSale) {
    setStoreSale(next);
    setSavingStoreSale(true);
    const { error } = await saveStoreSale(next);
    setSavingStoreSale(false);
    if (error) return toast.error(error.message);
    toast.success(
      next.active && next.percent > 0
        ? `Store-wide sale live — ${next.percent}% off everything`
        : "Store-wide sale saved",
    );
  }

  async function toggleSaleBanner(cp: Coupon, enabled: boolean) {
    const { error } = await supabase
      .from("store_coupons")
      .update({ public_listed: enabled })
      .eq("id", cp.id);
    if (error) return toast.error(error.message);
    toast.success(enabled ? `Sale banner now showing "${cp.code}"` : `Removed "${cp.code}" from banner`);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={tab === "items" ? "default" : "outline"} onClick={() => setTab("items")}>
          Items ({items.length})
        </Button>
        <Button
          variant={tab === "categories" ? "default" : "outline"}
          onClick={() => setTab("categories")}
        >
          Categories ({cats.length})
        </Button>
        <Button
          variant={tab === "coupons" ? "default" : "outline"}
          onClick={() => setTab("coupons")}
        >
          Coupons ({coupons.length})
        </Button>
        <Button variant={tab === "sale" ? "default" : "outline"} onClick={() => setTab("sale")}>
          Sale
        </Button>
      </div>

      {tab === "items" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setEditingItem({ ...emptyItem, category_id: cats[0]?.id ?? "" })}>
              <Plus className="h-4 w-4 mr-1" /> New item
            </Button>
          </div>

          {editingItem && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {"id" in editingItem && editingItem.id ? "Edit" : "New"} item
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={editingItem.category_id}
                      onValueChange={(v) => setEditingItem({ ...editingItem, category_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose category" />
                      </SelectTrigger>
                      <SelectContent>
                        {cats.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingItem.price ?? 0}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, price: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={editingItem.currency ?? "USD"}
                      onChange={(e) => setEditingItem({ ...editingItem, currency: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Badge (e.g. Popular)</Label>
                    <Input
                      value={editingItem.badge ?? ""}
                      onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      value={editingItem.sort_order}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          sort_order: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Image URL</Label>
                    <Input
                      value={editingItem.image_url ?? ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, image_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Buy/External URL</Label>
                    <Input
                      value={editingItem.external_url ?? ""}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, external_url: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={editingItem.description ?? ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, description: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Perks (one per line — powers the rank comparison table)</Label>
                  <Textarea
                    rows={6}
                    placeholder={"Colored chat & custom nickname\nPriority queue\n/kit weekly"}
                    value={(editingItem.perks ?? []).join("\n")}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        perks: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingItem.featured}
                      onCheckedChange={(v) => setEditingItem({ ...editingItem, featured: v })}
                    />
                    <span>Featured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingItem.published}
                      onCheckedChange={(v) => setEditingItem({ ...editingItem, published: v })}
                    />
                    <span>Published</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveItem}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingItem(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0 divide-y">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between p-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {it.name}{" "}
                      {!it.published && (
                        <span className="text-xs text-muted-foreground">(draft)</span>
                      )}
                      {it.featured && (
                        <span className="ml-2 text-[10px] uppercase tracking-widest text-primary">
                          featured
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {catName(it.category_id)} · {(it.currency ?? "USD").toUpperCase()}{" "}
                      {Number(it.price ?? 0).toFixed(2)}
                      {it.badge ? ` · ${it.badge}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingItem(it)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeItem(it)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <p className="p-4 text-muted-foreground">No items yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === "categories" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setEditingCat({ ...emptyCat })}>
              <Plus className="h-4 w-4 mr-1" /> New category
            </Button>
          </div>

          {editingCat && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {"id" in editingCat && editingCat.id ? "Edit" : "New"} category
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingCat.name}
                      onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Slug (auto if blank)</Label>
                    <Input
                      value={editingCat.slug}
                      onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Icon</Label>
                    <Select
                      value={editingCat.icon ?? "Package"}
                      onValueChange={(v) => setEditingCat({ ...editingCat, icon: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((n) => (
                          <SelectItem key={n} value={n}>
                            {n}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      value={editingCat.sort_order}
                      onChange={(e) =>
                        setEditingCat({
                          ...editingCat,
                          sort_order: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={editingCat.description ?? ""}
                    onChange={(e) =>
                      setEditingCat({ ...editingCat, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingCat.published}
                    onCheckedChange={(v) => setEditingCat({ ...editingCat, published: v })}
                  />
                  <span>Published</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveCat}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingCat(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0 divide-y">
              {cats.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {c.name}{" "}
                      {!c.published && (
                        <span className="text-xs text-muted-foreground">(draft)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      /{c.slug} · {c.icon || "Package"} ·{" "}
                      {items.filter((i) => i.category_id === c.id).length} items
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingCat(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeCat(c)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {cats.length === 0 && (
                <p className="p-4 text-muted-foreground">No categories yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === "coupons" && (
        <>
          <div className="flex justify-end">
            <Button onClick={() => setEditingCoupon({ ...emptyCoupon })}>
              <Plus className="h-4 w-4 mr-1" /> New coupon
            </Button>
          </div>

          {editingCoupon && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {"id" in editingCoupon && editingCoupon.id ? "Edit" : "New"} coupon
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Code</Label>
                    <Input
                      value={editingCoupon.code}
                      onChange={(e) =>
                        setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })
                      }
                      placeholder="LAUNCH10"
                      className="font-mono uppercase"
                    />
                  </div>
                  <div>
                    <Label>Discount type</Label>
                    <Select
                      value={editingCoupon.discount_type}
                      onValueChange={(v) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          discount_type: v as "percent" | "fixed",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">Percent (%)</SelectItem>
                        <SelectItem value="fixed">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Discount value{" "}
                      {editingCoupon.discount_type === "percent" ? "(%)" : `(${editingCoupon.currency || "USD"})`}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingCoupon.discount_value}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          discount_value: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Input
                      value={editingCoupon.currency ?? "USD"}
                      onChange={(e) =>
                        setEditingCoupon({ ...editingCoupon, currency: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Min. subtotal to apply</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingCoupon.min_subtotal}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          min_subtotal: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Max uses (blank = unlimited)</Label>
                    <Input
                      type="number"
                      value={editingCoupon.max_uses ?? ""}
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          max_uses: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Starts at (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={
                        editingCoupon.starts_at
                          ? new Date(editingCoupon.starts_at).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Expires at (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={
                        editingCoupon.expires_at
                          ? new Date(editingCoupon.expires_at).toISOString().slice(0, 16)
                          : ""
                      }
                      onChange={(e) =>
                        setEditingCoupon({
                          ...editingCoupon,
                          expires_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    rows={2}
                    value={editingCoupon.description ?? ""}
                    onChange={(e) =>
                      setEditingCoupon({ ...editingCoupon, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingCoupon.active}
                    onCheckedChange={(v) => setEditingCoupon({ ...editingCoupon, active: v })}
                  />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!editingCoupon.public_listed}
                    onCheckedChange={(v) =>
                      setEditingCoupon({ ...editingCoupon, public_listed: v })
                    }
                  />
                  <span>Advertise publicly (shown in sale banner &amp; coupon list)</span>
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveCoupon}>Save</Button>
                  <Button variant="outline" onClick={() => setEditingCoupon(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0 divide-y">
              {coupons.map((cp) => {
                const expired = cp.expires_at && new Date(cp.expires_at) < new Date();
                const maxed = cp.max_uses != null && cp.uses_count >= cp.max_uses;
                return (
                  <div key={cp.id} className="flex items-center justify-between p-3 gap-3">
                    <div className="min-w-0">
                      <div className="font-mono font-semibold truncate">
                        {cp.code}{" "}
                        {!cp.active && (
                          <span className="text-xs text-muted-foreground">(inactive)</span>
                        )}
                        {expired && (
                          <span className="ml-2 text-[10px] uppercase tracking-widest text-destructive">
                            expired
                          </span>
                        )}
                        {maxed && (
                          <span className="ml-2 text-[10px] uppercase tracking-widest text-destructive">
                            maxed
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {cp.discount_type === "percent"
                          ? `${cp.discount_value}% off`
                          : `${(cp.currency ?? "USD").toUpperCase()} ${Number(cp.discount_value).toFixed(2)} off`}
                        {cp.min_subtotal > 0
                          ? ` · min ${(cp.currency ?? "USD").toUpperCase()} ${Number(cp.min_subtotal).toFixed(2)}`
                          : ""}
                        {" · "}
                        {cp.uses_count}
                        {cp.max_uses != null ? `/${cp.max_uses}` : ""} uses
                        {cp.expires_at
                          ? ` · exp ${new Date(cp.expires_at).toLocaleDateString()}`
                          : ""}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingCoupon(cp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeCoupon(cp)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {coupons.length === 0 && (
                <p className="p-4 text-muted-foreground">No coupons yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {tab === "sale" && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Store-wide sale (no code needed)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Automatically takes a percentage off every item in the cart — customers don't
                need to enter a coupon.
              </p>
              <div className="flex items-center gap-3">
                <Switch
                  checked={storeSale.active}
                  onCheckedChange={(v) => setStoreSale({ ...storeSale, active: v })}
                />
                <Label>Sale active</Label>
                {isStoreSaleLive(storeSale) && (
                  <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                    Live · {storeSale.percent}% off
                  </span>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={storeSale.percent}
                    onChange={(e) =>
                      setStoreSale({ ...storeSale, percent: Number(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Banner text</Label>
                  <Input
                    value={storeSale.label}
                    placeholder="Store-wide sale"
                    onChange={(e) => setStoreSale({ ...storeSale, label: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Ends at (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={
                      storeSale.ends_at
                        ? new Date(storeSale.ends_at).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) =>
                      setStoreSale({
                        ...storeSale,
                        ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button disabled={savingStoreSale} onClick={() => persistStoreSale(storeSale)}>
                  Save sale
                </Button>
                <Button
                  variant="outline"
                  disabled={savingStoreSale}
                  onClick={() =>
                    persistStoreSale({ ...storeSale, active: true, percent: 35 })
                  }
                >
                  Quick: 35% off everything
                </Button>
                {storeSale.active && (
                  <Button
                    variant="ghost"
                    disabled={savingStoreSale}
                    onClick={() => persistStoreSale({ ...storeSale, active: false })}
                  >
                    End sale
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Site-wide sale banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {liveSale ? (
                <div className="rounded-lg border border-primary/40 bg-primary/10 p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
                    Sale live
                  </div>
                  <div className="mt-1 font-semibold">
                    {liveSale.description?.trim() || "Store Sale"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Code <span className="font-mono">{liveSale.code}</span> ·{" "}
                    {liveSale.discount_type === "percent"
                      ? `${liveSale.discount_value}% off`
                      : `${(liveSale.currency ?? "USD").toUpperCase()} ${Number(liveSale.discount_value).toFixed(2)} off`}
                    {liveSale.expires_at
                      ? ` · ends ${new Date(liveSale.expires_at).toLocaleString()}`
                      : " · no end date"}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No sale is currently showing on the site. Feature an active coupon below to
                  display the banner on every page.
                </p>
              )}
              <Button
                onClick={() => {
                  setEditingCoupon({ ...emptyCoupon, public_listed: true });
                  setTab("coupons");
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> New sale coupon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 divide-y">
              {coupons.map((cp) => {
                const expired = cp.expires_at && new Date(cp.expires_at) < new Date();
                return (
                  <div key={cp.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <div className="font-mono font-semibold truncate">
                        {cp.code}
                        {!cp.active && (
                          <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                        )}
                        {expired && (
                          <span className="ml-2 text-[10px] uppercase tracking-widest text-destructive">
                            expired
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {cp.description?.trim() || "No banner text"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Label className="text-xs text-muted-foreground">Show in banner</Label>
                      <Switch
                        checked={cp.public_listed}
                        onCheckedChange={(v) => toggleSaleBanner(cp, v)}
                      />
                    </div>
                  </div>
                );
              })}
              {coupons.length === 0 && (
                <p className="p-4 text-muted-foreground">No coupons yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default StoreAdminSection;
