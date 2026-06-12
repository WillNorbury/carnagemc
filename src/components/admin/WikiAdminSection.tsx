import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { logWebsiteEvent } from "@/lib/logEvent";
import { Pencil, Trash2, Plus } from "lucide-react";

type Article = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  excerpt: string | null;
  content: string;
  published: boolean;
  sort_order: number;
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const empty: Omit<Article, "id"> = { slug: "", title: "", category: "", excerpt: "", content: "", published: true, sort_order: 0 };

export function WikiAdminSection() {
  const [items, setItems] = useState<Article[]>([]);
  const [editing, setEditing] = useState<Article | (Omit<Article, "id"> & { id?: string }) | null>(null);

  async function load() {
    const { data } = await supabase.from("wiki_articles").select("*").order("sort_order").order("title");
    setItems((data as Article[]) ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    const a = editing;
    if (!a.title.trim()) return toast.error("Title required");
    const slug = a.slug.trim() || slugify(a.title);
    const payload = {
      title: a.title.trim(),
      slug,
      category: a.category || null,
      excerpt: a.excerpt || null,
      content: a.content,
      published: a.published,
      sort_order: a.sort_order ?? 0,
    };
    if ("id" in a && a.id) {
      const { error } = await supabase.from("wiki_articles").update(payload).eq("id", a.id);
      if (error) return toast.error(error.message);
      logWebsiteEvent({ kind: "wiki_update", title: "Wiki article updated", detail: payload.title, url: `/wiki/${slug}` });
    } else {
      const { error } = await supabase.from("wiki_articles").insert([payload]);
      if (error) return toast.error(error.message);
      logWebsiteEvent({ kind: "wiki_create", title: "Wiki article created", detail: payload.title, url: `/wiki/${slug}`, color: 0x10b981 });
    }
    toast.success("Saved");
    setEditing(null);
    load();
  }

  async function remove(a: Article) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    const { error } = await supabase.from("wiki_articles").delete().eq("id", a.id);
    if (error) return toast.error(error.message);
    logWebsiteEvent({ kind: "wiki_delete", title: "Wiki article deleted", detail: a.title, color: 0xef4444 });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{items.length} article(s)</p>
        <Button onClick={() => setEditing({ ...empty })}><Plus className="h-4 w-4 mr-1" /> New article</Button>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle>{"id" in editing && editing.id ? "Edit" : "New"} article</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Slug (auto if blank)</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
              <div><Label>Category</Label><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
              <div><Label>Sort order</Label><Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} /></div>
            </div>
            <div><Label>Excerpt</Label><Input value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} /></div>
            <div><Label>Content (markdown)</Label><Textarea rows={14} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} /><span>Published</span></div>
            <div className="flex gap-2"><Button onClick={save}>Save</Button><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button></div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0 divide-y">
          {items.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{a.title} {!a.published && <span className="text-xs text-muted-foreground">(draft)</span>}</div>
                <div className="text-xs text-muted-foreground truncate">{a.category || "General"} · /{a.slug}</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(a)}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="p-4 text-muted-foreground">No articles yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
