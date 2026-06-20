import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, ArrowLeft, Loader2 } from "lucide-react";

type Row = {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  percent: number;
  score: number;
  max_score: number;
  duration_seconds: number;
};

const QuizLeaderboard = () => {
  const { slug } = useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const [{ data: q }, { data: lb }] = await Promise.all([
        (supabase.from("quizzes" as any) as any).select("title").eq("slug", slug).maybeSingle(),
        (supabase.rpc as any)("get_quiz_leaderboard", { _slug: slug, _limit: 50 }),
      ]);
      setQuizTitle((q as any)?.title ?? "Quiz");
      setRows((lb as Row[]) ?? []);
      setLoading(false);
      document.title = `Leaderboard — ${(q as any)?.title ?? "Quiz"}`;
    })();
  }, [slug]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container pt-28 pb-20 max-w-2xl">
        <Button asChild variant="ghost" size="sm" className="mb-3">
          <Link to={`/quiz/${slug}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to quiz</Link>
        </Button>
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-black">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">{quizTitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground">No attempts yet — be the first!</p>
          </Card>
        ) : (
          <Card className="divide-y">
            {rows.map((r) => (
              <div key={r.user_id} className="flex items-center gap-3 p-3">
                <div className={`w-8 text-center font-bold ${r.rank === 1 ? "text-yellow-500" : r.rank === 2 ? "text-zinc-400" : r.rank === 3 ? "text-amber-700" : "text-muted-foreground"}`}>
                  #{r.rank}
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={r.avatar_url ?? undefined} />
                  <AvatarFallback>{(r.display_name ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.display_name ?? "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.score}/{r.max_score} · {r.duration_seconds}s
                  </p>
                </div>
                <Badge variant={r.rank <= 3 ? "default" : "outline"}>
                  {Number(r.percent).toFixed(0)}%
                </Badge>
              </div>
            ))}
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default QuizLeaderboard;
