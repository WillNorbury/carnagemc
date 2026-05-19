import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";

type Priority = "low" | "normal" | "high" | "urgent";

type News = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  slug: string;
  cover_url: string | null;
  priority: Priority;
  created_at: string;
};

const priorityStyles: Record<Priority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-primary/15 text-primary border-primary/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};

const NewsPage = () => {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Announcements — XyloMC";
    supabase
      .from("news")
      .select("id,title,excerpt,content,slug,cover_url,priority,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems((data ?? []) as News[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-28 pb-16 max-w-4xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-sm text-muted-foreground">
              Latest news and updates from the XyloMC team.
            </p>
          </div>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground bg-card/60 border-border/60">
            No announcements yet — check back soon.
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((n) => (
              <Link key={n.id} to={`/news/${n.slug}`} className="block group">
                <Card className="p-5 bg-card/60 border-border/60 hover:border-primary/50 transition">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-semibold group-hover:text-primary transition">
                      {n.title}
                    </h2>
                    <Badge variant="outline" className={priorityStyles[n.priority]}>
                      {n.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {n.excerpt || n.content}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;
