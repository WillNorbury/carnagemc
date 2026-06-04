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
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  published: boolean;
};

const blank = { question: "", answer: "", category: "general", sort_order: 0, published: true };

const AdminFaqs = () => {
  const { user, isAdmin, loading } = useAuth();
  const [items, setItems] = useState<Faq[]>([]);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "FAQs — Admin · HavocSMP";
    load();
  }, []);

  const load = async () => {
    const { data } = await (supabase.from("faqs" as any) as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setItems((data as Faq[]) ?? []);
  };

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" replace />;

  const startEdit = (f: Faq) => {
    setEditing(f);
    setForm({
      question: f.question,
      answer: f.answer,
      category: f.category,
      sort_order: f.sort_order,
      published: f.published,
    });
  };

  const reset = () => {
    setEditing(null);
    setForm(blank);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer required");
      return;
    }
    setSaving(true);
    if (editing) {
      const { error } = await (supabase.from("faqs" as any) as any).update(form).eq("id", editing.id);
      if (error) toast.error(error.message);
      else {
        toast.success("FAQ updated");
        reset();
        load();
      }
    } else {
      const { error } = await (supabase.from("faqs" as any) as any).insert(form);
      if (error) toast.error(error.message);
      else {
        toast.success("FAQ created");
        reset();
        load();
      }
    }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!(await confirm({ title: "Delete FAQ?", description: "This cannot be undone." }))) return;
    const { error } = await (supabase.from("faqs" as any) as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/admin"><ArrowLeft className="h-4 w-4 mr-1" /> Back to admin</Link>
            </Button>
            <h1 className="text-3xl font-bold">FAQs</h1>
            <p className="text-muted-foreground">Manage the public help center.</p>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="font-display font-bold text-lg">{editing ? "Edit FAQ" : "Create FAQ"}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Question</Label>
              <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="general"
              />
            </div>
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              rows={5}
            />
          </div>
          <div className="flex items-center gap-6">
            <div>
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="w-28"
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setForm({ ...form, published: v })}
              />
              <Label>Published</Label>
            </div>
            <div className="flex-1" />
            {editing && (
              <Button variant="ghost" onClick={reset}>
                Cancel
              </Button>
            )}
            <Button onClick={save} disabled={saving}>
              {editing ? <Pencil className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {editing ? "Save" : "Create"}
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          {items.length === 0 ? (
            <Card className="p-10 text-center text-muted-foreground">No FAQs yet.</Card>
          ) : (
            items.map((f) => (
              <Card key={f.id} className="p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-muted capitalize">{f.category}</span>
                    {!f.published && <span className="text-xs text-muted-foreground">Draft</span>}
                  </div>
                  <h3 className="font-medium">{f.question}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{f.answer}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(f)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(f.id)}>
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

export default AdminFaqs;
