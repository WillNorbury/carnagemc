import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Trophy, RotateCw, Loader2 } from "lucide-react";

type Attempt = {
  id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percent: number;
  passed: boolean;
  duration_seconds: number;
  answers: { question_id: string; option_id: string | null; correct: boolean }[];
};

const QuizResult = () => {
  const { slug, attemptId } = useParams();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questionMap, setQuestionMap] = useState<Record<string, { prompt: string; explanation: string | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId) return;
    (async () => {
      const { data: a } = await (supabase.from("quiz_attempts" as any) as any)
        .select("*")
        .eq("id", attemptId)
        .maybeSingle();
      if (!a) {
        setLoading(false);
        return;
      }
      setAttempt(a as Attempt);
      const { data: q } = await (supabase.from("quizzes" as any) as any)
        .select("title")
        .eq("id", (a as any).quiz_id)
        .maybeSingle();
      setQuizTitle((q as any)?.title ?? "Quiz");
      const ids = ((a as any).answers ?? []).map((x: any) => x.question_id);
      if (ids.length) {
        const { data: qs } = await (supabase.from("quiz_questions" as any) as any)
          .select("id,prompt,explanation")
          .in("id", ids);
        const m: any = {};
        for (const row of (qs as any[]) ?? []) m[row.id] = { prompt: row.prompt, explanation: row.explanation };
        setQuestionMap(m);
      }
      setLoading(false);
      document.title = `Result — ${quizTitle}`;
    })();
  }, [attemptId, quizTitle]);

  if (loading) {
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

  if (!attempt) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 container py-28 max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold mb-2">Result not found</h1>
          <Button asChild><Link to="/quiz">Back to quizzes</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container pt-28 pb-20 max-w-2xl">
        <Card className="p-8 text-center">
          <Badge variant={attempt.passed ? "default" : "destructive"} className="mb-4">
            {attempt.passed ? "Passed" : "Did not pass"}
          </Badge>
          <h1 className="font-display text-4xl font-black mb-2">
            <span className="text-gradient">{Number(attempt.percent).toFixed(0)}%</span>
          </h1>
          <p className="text-muted-foreground mb-1">
            {attempt.score} / {attempt.max_score} points · {attempt.duration_seconds}s
          </p>
          <p className="text-sm text-muted-foreground">{quizTitle}</p>
          <div className="flex gap-2 justify-center mt-6 flex-wrap">
            <Button asChild>
              <Link to={`/quiz/${slug}`}><RotateCw className="h-4 w-4 mr-1" /> Try again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={`/quiz/${slug}/leaderboard`}><Trophy className="h-4 w-4 mr-1" /> Leaderboard</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/quiz">All quizzes</Link>
            </Button>
          </div>
        </Card>

        <h2 className="font-display text-xl font-bold mt-8 mb-3">Review</h2>
        <div className="space-y-3">
          {attempt.answers.map((a, i) => {
            const q = questionMap[a.question_id];
            return (
              <Card key={a.question_id} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                      a.correct ? "bg-emerald-500/20 text-emerald-500" : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {a.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {i + 1}. {q?.prompt ?? "Question"}
                    </p>
                    {q?.explanation && (
                      <p className="text-sm text-muted-foreground mt-1">{q.explanation}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizResult;
