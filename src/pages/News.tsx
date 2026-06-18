import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";
import { format } from "date-fns";

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

const priorityColor: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-primary/10 text-primary",
  high: "bg-amber-500/15 text-amber-500",
  urgent: "bg-destructive/15 text-destructive",
};

const priorityAccent: Record<string, string> = {
  low: "from-muted to-muted/80",
  normal: "from-primary/80 to-primary/40",
  high: "from-amber-600/80 to-amber-500/40",
  urgent: "from-destructive/80 to-destructive/40",
};

const NewsPage = () => {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "News — CarnageMC";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container text-center max-w-3xl animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">News</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Stay up to date with the latest from CarnageMC.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 bg-background">
          <div className="container max-w-5xl">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : items.length === 0 ? (
              <Card className="border-dashed max-w-md mx-auto">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-foreground">No news yet</h3>
                  <p className="text-muted-foreground text-sm mt-1">Check back later for updates</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((n) => (
                  <Link
                    key={n.id}
                    to={`/news/${n.slug}`}
                    className="group block overflow-hidden rounded-xl bg-card border border-border hover:border-primary/40 transition-colors"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {n.cover_url ? (
                        <img
                          src={n.cover_url}
                          alt={n.title}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className={`h-full w-full bg-gradient-to-br ${priorityAccent[n.priority] || priorityAccent.normal} flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}
                        >
                          <Megaphone className="h-10 w-10 text-primary-foreground/80" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Badge className={`${priorityColor[n.priority] || ""} text-[10px]`}>
                          {n.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(n.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground truncate">{n.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {n.excerpt || n.content}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NewsPage;
