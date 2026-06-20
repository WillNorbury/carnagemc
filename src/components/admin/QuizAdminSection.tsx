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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";
import { Plus, Pencil, Trash2, ArrowLeft, Check, Loader2 } from "lucide-react";

type Quiz = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  passing_score: number;
  time_limit_seconds: number | null;
  randomize: boolean;
  published: boolean;
  created_at: string;
};

type Question = {
  id: string;
  quiz_id: string;
  prompt: string;
  explanation: string | null;
  points: number;
  sort_order: number;
};

type Option = {
  id: string;
  question_id: string;
  label: string;
  is_correct: boolean;
  sort_order: number;
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const QuizAdminSection = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Quiz | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase.from("quizzes" as any) as any)
      .select("*")
      .order("created_at", { ascending: false });
    setQuizzes((data as Quiz[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!(await confirm({ title: "Delete quiz?", description: "All questions and attempts will be removed.", destructive: true }))) return;
    const { error } = await (supabase.from("quizzes" as any) as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  if (selected) {
    return <QuestionsEditor quiz={selected} onBack={() => { setSelected(null); load(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-1" /> New quiz</Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : quizzes.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No quizzes yet.</Card>
      ) : (
        <div className="space-y-2">
          {quizzes.map((q) => (
            <Card key={q.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold truncate">{q.title}</h3>
                  <Badge variant={q.published ? "default" : "outline"}>
                    {q.published ? "Published" : "Draft"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{q.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">/{q.slug} · Pass {q.passing_score}%</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelected(q)}>Questions</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(q)}><Pencil className="h-4 w-4" /></Button>
              <Button size="sm" variant="destructive" onClick={() => remove(q.id)}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <QuizFormDialog
          quiz={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
};

const QuizFormDialog = ({
  quiz,
  onClose,
  onSaved,
}: {
  quiz: Quiz | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    title: quiz?.title ?? "",
    slug: quiz?.slug ?? "",
    description: quiz?.description ?? "",
    category: quiz?.category ?? "general",
    passing_score: quiz?.passing_score ?? 70,
    time_limit_seconds: quiz?.time_limit_seconds ?? null as number | null,
    randomize: quiz?.randomize ?? false,
    published: quiz?.published ?? false,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return toast.error("Title required");
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim() || slugify(form.title),
      description: form.description.trim() || null,
    };
    const op = quiz
      ? (supabase.from("quizzes" as any) as any).update(payload).eq("id", quiz.id)
      : (supabase.from("quizzes" as any) as any).insert(payload);
    const { error } = await op;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{quiz ? "Edit quiz" : "New quiz"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              placeholder={slugify(form.title) || "auto-from-title"}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div>
              <Label>Passing score %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.passing_score}
                onChange={(e) => setForm({ ...form, passing_score: Number(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <Label>Time limit (seconds, blank = none)</Label>
            <Input
              type="number"
              min={0}
              value={form.time_limit_seconds ?? ""}
              onChange={(e) => setForm({ ...form, time_limit_seconds: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Randomize questions</Label>
            <Switch checked={form.randomize} onCheckedChange={(v) => setForm({ ...form, randomize: v })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Published</Label>
            <Switch checked={form.published} onCheckedChange={(v) => setForm({ ...form, published: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const QuestionsEditor = ({ quiz, onBack }: { quiz: Quiz; onBack: () => void }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [optionsMap, setOptionsMap] = useState<Record<string, Option[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: qs } = await (supabase.from("quiz_questions" as any) as any)
      .select("*")
      .eq("quiz_id", quiz.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    const qList = (qs as Question[]) ?? [];
    setQuestions(qList);
    if (qList.length) {
      const { data: opts } = await (supabase.from("quiz_options" as any) as any)
        .select("*")
        .in("question_id", qList.map((q) => q.id))
        .order("sort_order", { ascending: true });
      const m: Record<string, Option[]> = {};
      for (const o of (opts as Option[]) ?? []) (m[o.question_id] ??= []).push(o);
      setOptionsMap(m);
    } else {
      setOptionsMap({});
    }
    setLoading(false);
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.id]);

  const addQuestion = async () => {
    const sort = questions.length;
    const { data, error } = await (supabase.from("quiz_questions" as any) as any)
      .insert({ quiz_id: quiz.id, prompt: "New question", points: 1, sort_order: sort })
      .select()
      .single();
    if (error) return toast.error(error.message);
    const q = data as Question;
    // Two starter options
    const { data: opts } = await (supabase.from("quiz_options" as any) as any)
      .insert([
        { question_id: q.id, label: "Option A", is_correct: true, sort_order: 0 },
        { question_id: q.id, label: "Option B", is_correct: false, sort_order: 1 },
      ])
      .select();
    setQuestions([...questions, q]);
    setOptionsMap({ ...optionsMap, [q.id]: (opts as Option[]) ?? [] });
  };

  const updateQuestion = async (id: string, patch: Partial<Question>) => {
    const { error } = await (supabase.from("quiz_questions" as any) as any).update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const deleteQuestion = async (id: string) => {
    if (!(await confirm({ title: "Delete question?", destructive: true }))) return;
    const { error } = await (supabase.from("quiz_questions" as any) as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const addOption = async (qid: string) => {
    const sort = (optionsMap[qid]?.length ?? 0);
    const { data, error } = await (supabase.from("quiz_options" as any) as any)
      .insert({ question_id: qid, label: "New option", is_correct: false, sort_order: sort })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setOptionsMap({ ...optionsMap, [qid]: [...(optionsMap[qid] ?? []), data as Option] });
  };

  const updateOption = async (oid: string, qid: string, patch: Partial<Option>) => {
    const { error } = await (supabase.from("quiz_options" as any) as any).update(patch).eq("id", oid);
    if (error) return toast.error(error.message);
    setOptionsMap({
      ...optionsMap,
      [qid]: (optionsMap[qid] ?? []).map((o) => (o.id === oid ? { ...o, ...patch } : o)),
    });
  };

  const setCorrect = async (qid: string, oid: string) => {
    // mark this one correct, others incorrect (single-correct UI)
    const list = optionsMap[qid] ?? [];
    await Promise.all(
      list.map((o) =>
        (supabase.from("quiz_options" as any) as any).update({ is_correct: o.id === oid }).eq("id", o.id),
      ),
    );
    setOptionsMap({
      ...optionsMap,
      [qid]: list.map((o) => ({ ...o, is_correct: o.id === oid })),
    });
  };

  const deleteOption = async (oid: string, qid: string) => {
    const { error } = await (supabase.from("quiz_options" as any) as any).delete().eq("id", oid);
    if (error) return toast.error(error.message);
    setOptionsMap({ ...optionsMap, [qid]: (optionsMap[qid] ?? []).filter((o) => o.id !== oid) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to quizzes
        </Button>
        <Button onClick={addQuestion}><Plus className="h-4 w-4 mr-1" /> Add question</Button>
      </div>
      <Card className="p-4">
        <h2 className="font-bold">{quiz.title}</h2>
        <p className="text-sm text-muted-foreground">Editing questions for this quiz.</p>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : questions.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No questions yet. Add one to get started.</Card>
      ) : (
        questions.map((q, i) => (
          <Card key={q.id} className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground text-sm mt-2">#{i + 1}</span>
              <Textarea
                value={q.prompt}
                onChange={(e) => setQuestions(questions.map((x) => (x.id === q.id ? { ...x, prompt: e.target.value } : x)))}
                onBlur={(e) => updateQuestion(q.id, { prompt: e.target.value })}
                className="flex-1"
              />
              <div className="w-20">
                <Label className="text-xs">Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={q.points}
                  onChange={(e) => setQuestions(questions.map((x) => (x.id === q.id ? { ...x, points: Number(e.target.value) } : x)))}
                  onBlur={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                />
              </div>
              <Button size="sm" variant="destructive" onClick={() => deleteQuestion(q.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Input
              placeholder="Explanation (optional, shown after answering)"
              value={q.explanation ?? ""}
              onChange={(e) => setQuestions(questions.map((x) => (x.id === q.id ? { ...x, explanation: e.target.value } : x)))}
              onBlur={(e) => updateQuestion(q.id, { explanation: e.target.value || null })}
            />
            <div className="space-y-2 pl-4 border-l-2 border-border">
              {(optionsMap[q.id] ?? []).map((o) => (
                <div key={o.id} className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={o.is_correct ? "default" : "outline"}
                    className="h-8 w-8 p-0 shrink-0"
                    onClick={() => setCorrect(q.id, o.id)}
                    title={o.is_correct ? "Correct" : "Mark correct"}
                  >
                    {o.is_correct && <Check className="h-4 w-4" />}
                  </Button>
                  <Input
                    value={o.label}
                    onChange={(e) =>
                      setOptionsMap({
                        ...optionsMap,
                        [q.id]: (optionsMap[q.id] ?? []).map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)),
                      })
                    }
                    onBlur={(e) => updateOption(o.id, q.id, { label: e.target.value })}
                  />
                  <Button size="sm" variant="ghost" onClick={() => deleteOption(o.id, q.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => addOption(q.id)}>
                <Plus className="h-4 w-4 mr-1" /> Add option
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default QuizAdminSection;
