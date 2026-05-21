import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  category: string;
  published: boolean;
  sort_order: number;
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || `event-${Date.now()}`;

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const blank = () => ({
  title: "",
  description: "",
  location: "",
  starts_at: toLocalInput(new Date(Date.now() + 86400000).toISOString()),
  ends_at: "",
  cover_url: "",
  category: "event",
  published: true,
  sort_order: 0,
});

const AdminEvents = () => {
  const { user, isAdmin, loading } = useAuth();
  const [items, setItems] = useState<Event[]>([]);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(blank());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Events — Admin · XyloMC";
    load();
  }, []);

  const load = async () => {
    const { data } = await (supabase.from("events" as any) as any)
      .select("*")
      .order("starts_at", { ascending: false });
    setItems((data as Event[]) ?? []);
  };

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const startEdit = (e: Event) => {
    setEditing(e);
    setForm({
      title: e.title,
      description: e.description,
      location: e.location ?? "",
      starts_at: toLocalInput(e.starts_at),
      ends_at: e.ends_at ? toLocalInput(e.ends_at) : "",
      cover_url: e.cover_url ?? "",
      category: e.category,
      published: e.published,
      sort_order: e.sort_order,
    });
  };

  const reset = () => {
    setEditing(null);
    setForm(blank());
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    const payload: any = {
      title: form.title,
      description: form.description,
      location: form.location || null,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      cover_url: form.cover_url || null,
      category: form.category || "event",
      published: form.published,
      sort_order: form.sort_order,
    };
    if (editing) {
      const { error } = await (supabase.from("events" as any) as any).update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Event updated");
        reset();
        load();
      }
    } else {
      payload.slug = `${slugify(form.title)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await (supabase.from("events" as any) as any).insert(payload);
      if (error) toast.error(error.message);
      else {
        toast.success("Event created");
        reset();
        load();
      }
    }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!(await confirm({ title: "Delete event?", description: "This cannot be undone." }))) return;
    const { error } = await (supabase.from("events" as any) as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back to admin</Link>
          </Button>
          <h1 className="text-3xl font-bold">Events</h1>
          <p className="text-muted-foreground">Manage tournaments, drops, and community events.</p>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="font-display font-bold text-lg">{editing ? "Edit Event" : "Create Event"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="event, tournament, drop…"
              />
            </div>
            <div>
              <Label>Starts at</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div>
              <Label>Ends at (optional)</Label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Discord, in-game world, etc."
              />
            </div>
            <div>
              <Label>Cover URL</Label>
              <Input
                value={form.cover_url}
                onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setForm({ ...form, published: v })}
              />
              <Label>Published</Label>
            </div>
            <div className="flex-1" />
            {editing && <Button variant="ghost" onClick={reset}>Cancel</Button>}
            <Button onClick={save} disabled={saving}>
              {editing ? <Pencil className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {items.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No events yet.</Card>
          ) : (
            items.map((e) => (
              <Card key={e.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted capitalize">{e.category}</span>
                    {!e.published && <span className="text-xs text-muted-foreground">Draft</span>}
                  </div>
                  <h3 className="font-medium">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.starts_at).toLocaleString()}
                    {e.location && ` · ${e.location}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(e)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(e.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminEvents;
