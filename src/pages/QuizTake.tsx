import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Clock, ArrowRight, Loader2 } from "lucide-react";

type Option = { id: string; label: string; sort_order: number };
type Question = { id: string; prompt: string; points: number; sort_order: number; options: Option[] };
type Quiz = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  passing_score: number;
  time_limit_seconds: number | null;
  randomize: boolean;
  questions: Question[];
};

const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const QuizTake = () => {
  const { slug } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data, error } = await (supabase.rpc as any)("get_quiz_with_questions", { _slug: slug });
      if (error || !data) {
        setLoading(false);
        return;
      }
      const q = data as Quiz;
      if (q.randomize) q.questions = shuffle(q.questions);
      setQuiz(q);
      if (q.time_limit_seconds) setRemaining(q.time_limit_seconds);
      document.title = `${q.title} — Quiz`;
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (remaining == null) return;
    if (remaining <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => (r == null ? null : r - 1)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const current = quiz?.questions[idx];
  const total = quiz?.questions.length ?? 0;
  const progress = total === 0 ? 0 : ((idx + 1) / total) * 100;
  const answered = useMemo(() => Object.keys(answers).length, [answers]);

  const choose = (optionId: string) => {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: optionId }));
  };

  const next = () => {
    if (idx < total - 1) setIdx(idx + 1);
  };

  const submit = async () => {
    if (!quiz || submitting) return;
    setSubmitting(true);
    const duration = Math.round((Date.now() - startedAt) / 1000);
    const payload = Object.entries(answers).map(([question_id, option_id]) => ({ question_id, option_id }));
    const { data, error } = await (supabase.rpc as any)("submit_quiz_attempt", {
      _quiz_id: quiz.id,
      _answers: payload,
      _duration_seconds: duration,
    });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }
    navigate(`/quiz/${quiz.slug}/result/${data}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-28 max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold mb-2">Sign in to take a quiz</h1>
          <p className="text-muted-foreground mb-6">Your score will be saved to the leaderboard.</p>
          <Button asChild><Link to="/auth">Sign in</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-28 max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold mb-2">Quiz not found</h1>
          <Button asChild className="mt-4"><Link to="/quiz">Back to quizzes</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-28 max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-muted-foreground">No questions in this quiz yet.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const fmtTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container pt-28 pb-20 max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-2xl font-bold">{quiz.title}</h1>
          {remaining != null && (
            <Badge variant={remaining < 30 ? "destructive" : "outline"}>
              <Clock className="h-3 w-3 mr-1" /> {fmtTime(remaining)}
            </Badge>
          )}
        </div>
        <Progress value={progress} className="mb-2" />
        <p className="text-xs text-muted-foreground mb-6">
          Question {idx + 1} of {total} · {answered} answered
        </p>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{current!.prompt}</h2>
          <div className="space-y-2">
            {current!.options.map((opt) => {
              const selected = answers[current!.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => choose(opt.id)}
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
            Previous
          </Button>
          {idx < total - 1 ? (
            <Button onClick={next} disabled={!answers[current!.id]}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizTake;
