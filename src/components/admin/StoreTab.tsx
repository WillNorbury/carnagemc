import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Package, Tag } from "lucide-react";
import { confirm } from "@/lib/confirm";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  published: boolean;
};

type Item = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  badge: string | null;
  featured: boolean;
  external_url: string | null;
  sort_order: number;
  published: boolean;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const emptyCategory = (sort_order = 0): Omit<Category, "id"> => ({
  slug: "",
  name: "",
  description: "",
  icon: "Package",
  sort_order,
  published: true,
});

const emptyItem = (sort_order = 0, category_id: string | null = null): Omit<Item, "id"> => ({
  category_id,
  name: "",
  description: "",
  price: 0,
  currency: "USD",
  image_url: "",
  badge: "",
  featured: false,
  external_url: "",
  sort_order,
  published: true,
});

export const StoreTab = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [editingCat, setEditingCat] = useState<Category | (Omit<Category, "id"> & { id?: string }) | null>(null);
  const [editingItem, setEditingItem] = useState<Item | (Omit<Item, "id"> & { id?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: cats }, { data: its }] = await Promise.all([
      supabase.from("store_categories").select("*").order("sort_order"),
      supabase.from("store_items").select("*").order("sort_order"),
    ]);
    setCategories((cats ?? []) as Category[]);
    setItems((its ?? []) as Item[]);
  };

  useEffect(() => {
    load();
  }, []);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])),
    [categories]
  );

  /* ---------------- Categories ---------------- */
  const saveCategory = async () => {
    if (!editingCat) return;
    const slug = (editingCat.slug || slugify(editingCat.name)).trim();
    if (!slug || !editingCat.name.trim()) {
      toast.error("Name and slug are required");
      return;
    }
    setSaving(true);
    const payload = { ...editingCat, slug };
    const { error } = editingCat.id
      ? await supabase.from("store_categories").update(payload).eq("id", editingCat.id)
      : await supabase.from("store_categories").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Category saved");
    setEditingCat(null);
    load();
  };

  const deleteCategory = async (id: string) => {
    if (!(await confirm({ title: "Delete category?", description: "Items in it will be uncategorized." }))) return;
    const { error } = await supabase.from("store_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  /* ---------------- Items ---------------- */
  const saveItem = async () => {
    if (!editingItem) return;
    if (!editingItem.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const payload = {
      ...editingItem,
      image_url: editingItem.image_url || null,
      badge: editingItem.badge || null,
      external_url: editingItem.external_url || null,
    };
    const { error } = editingItem.id
      ? await supabase.from("store_items").update(payload).eq("id", editingItem.id)
      : await supabase.from("store_items").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Item saved");
    setEditingItem(null);
    load();
  };

  const deleteItem = async (id: string) => {
    if (!(await confirm({ title: "Delete item?" }))) return;
    const { error } = await supabase.from("store_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <Tabs defaultValue="items" className="space-y-4">
      <TabsList>
        <TabsTrigger value="items"><Package className="h-4 w-4 mr-2" />Items</TabsTrigger>
        <TabsTrigger value="categories"><Tag className="h-4 w-4 mr-2" />Categories</TabsTrigger>
      </TabsList>

      {/* ---------------- Items ---------------- */}
      <TabsContent value="items" className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
          <Button
            size="sm"
            onClick={() => setEditingItem(emptyItem((items[items.length - 1]?.sort_order ?? 0) + 10))}
          >
            <Plus className="h-4 w-4 mr-1" /> New item
          </Button>
        </div>

        {editingItem && (
          <Card className="p-4 space-y-4 border-primary/40">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={editingItem.category_id ?? "none"}
                  onValueChange={(v) => setEditingItem({ ...editingItem, category_id: v === "none" ? null : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input value={editingItem.currency} onChange={(e) => setEditingItem({ ...editingItem, currency: e.target.value.toUpperCase() })} />
              </div>
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input value={editingItem.image_url ?? ""} onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Badge (e.g. NEW, SALE)</Label>
                <Input value={editingItem.badge ?? ""} onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>External Buy URL (optional)</Label>
                <Input value={editingItem.external_url ?? ""} onChange={(e) => setEditingItem({ ...editingItem, external_url: e.target.value })} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={3} value={editingItem.description} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={editingItem.sort_order}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2">
                  <Switch checked={editingItem.published} onCheckedChange={(v) => setEditingItem({ ...editingItem, published: v })} />
                  <span className="text-sm">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={editingItem.featured} onCheckedChange={(v) => setEditingItem({ ...editingItem, featured: v })} />
                  <span className="text-sm">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEditingItem(null)}>Cancel</Button>
              <Button onClick={saveItem} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </Card>
        )}

        <div className="grid gap-2">
          {items.map((it) => (
            <Card key={it.id} className="p-3 flex items-center gap-3">
              {it.image_url ? (
                <img src={it.image_url} alt={it.name} className="h-12 w-12 rounded object-cover" />
              ) : (
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{it.name}</span>
                  {it.badge && <Badge variant="secondary">{it.badge}</Badge>}
                  {it.featured && <Badge>Featured</Badge>}
                  {!it.published && <Badge variant="outline">Draft</Badge>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {it.category_id ? catMap[it.category_id]?.name ?? "—" : "Uncategorized"} · {it.currency} {it.price.toFixed(2)}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingItem(it)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteItem(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </Card>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No items yet.</p>
          )}
        </div>
      </TabsContent>

      {/* ---------------- Categories ---------------- */}
      <TabsContent value="categories" className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{categories.length} categor{categories.length === 1 ? "y" : "ies"}</p>
          <Button
            size="sm"
            onClick={() => setEditingCat(emptyCategory((categories[categories.length - 1]?.sort_order ?? 0) + 10))}
          >
            <Plus className="h-4 w-4 mr-1" /> New category
          </Button>
        </div>

        {editingCat && (
          <Card className="p-4 space-y-4 border-primary/40">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={editingCat.slug}
                  placeholder={slugify(editingCat.name)}
                  onChange={(e) => setEditingCat({ ...editingCat, slug: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} value={editingCat.description} onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  value={editingCat.sort_order}
                  onChange={(e) => setEditingCat({ ...editingCat, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <label className="flex items-center gap-2 pt-6">
                <Switch checked={editingCat.published} onCheckedChange={(v) => setEditingCat({ ...editingCat, published: v })} />
                <span className="text-sm">Published</span>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setEditingCat(null)}>Cancel</Button>
              <Button onClick={saveCategory} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </Card>
        )}

        <div className="grid gap-2">
          {categories.map((c) => (
            <Card key={c.id} className="p-3 flex items-center gap-3">
              <Tag className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <code className="text-xs text-muted-foreground">/{c.slug}</code>
                  {!c.published && <Badge variant="outline">Draft</Badge>}
                </div>
                {c.description && <div className="text-xs text-muted-foreground truncate">{c.description}</div>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditingCat(c)}><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={() => deleteCategory(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </Card>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};
