import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Trophy, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Quiz = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  passing_score: number;
  time_limit_seconds: number | null;
};

type WithMeta = Quiz & {
  question_count: number;
  best_percent: number | null;
};

const QuizListPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Quizzes — CarnageMC";
    (async () => {
      const { data: quizzes } = await (supabase.from("quizzes" as any) as any)
        .select("id,slug,title,description,category,passing_score,time_limit_seconds")
        .eq("published", true)
        .order("created_at", { ascending: false });
      const list = (quizzes as Quiz[]) ?? [];

      // counts
      const counts = await Promise.all(
        list.map(async (q) => {
          const { count } = await (supabase.from("quiz_questions" as any) as any)
            .select("id", { count: "exact", head: true })
            .eq("quiz_id", q.id);
          return count ?? 0;
        }),
      );

      // best score per quiz for current user
      let bestMap: Record<string, number> = {};
      if (user) {
        const { data: attempts } = await (supabase.from("quiz_attempts" as any) as any)
          .select("quiz_id,percent")
          .eq("user_id", user.id);
        for (const a of (attempts as any[]) ?? []) {
          const p = Number(a.percent);
          if (bestMap[a.quiz_id] == null || p > bestMap[a.quiz_id]) bestMap[a.quiz_id] = p;
        }
      }

      setItems(
        list.map((q, i) => ({
          ...q,
          question_count: counts[i],
          best_percent: bestMap[q.id] ?? null,
        })),
      );
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-10">
          <div className="absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
              <Brain className="h-3 w-3 mr-1" /> Quizzes
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">
              Test your <span className="text-gradient">knowledge</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Take a quiz, earn a spot on the leaderboard.
            </p>
          </div>
        </section>

        <div className="container pb-20 max-w-4xl">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">No quizzes yet — check back soon.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((q) => (
                <Card key={q.id} className="p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="capitalize mb-2">{q.category}</Badge>
                      <h2 className="font-display text-xl font-bold">{q.title}</h2>
                    </div>
                    {q.best_percent != null && (
                      <Badge className="shrink-0">
                        <Trophy className="h-3 w-3 mr-1" />
                        {q.best_percent.toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                  {q.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{q.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground flex gap-3">
                    <span>{q.question_count} question{q.question_count === 1 ? "" : "s"}</span>
                    <span>Pass: {q.passing_score}%</span>
                    {q.time_limit_seconds && <span>{Math.round(q.time_limit_seconds / 60)} min</span>}
                  </div>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button asChild className="flex-1">
                      <Link to={`/quiz/${q.slug}`}>
                        Start <ArrowRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link to={`/quiz/${q.slug}/leaderboard`}>
                        <Trophy className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuizListPage;
