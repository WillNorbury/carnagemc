import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/site/SEO";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ogImageFor = (title: string, eyebrow = "Announcement") =>
  `${SUPABASE_URL}/functions/v1/og-image?eyebrow=${encodeURIComponent(eyebrow)}&title=${encodeURIComponent(title)}`;

type Priority = "low" | "normal" | "high" | "urgent";

type Article = {
  id: string;
  title: string;
  content: string;
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

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("news")
      .select("id,title,content,cover_url,priority,created_at")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data as Article | null);
        setLoading(false);
        if (data) document.title = `${data.title} — XyloMC`;
      });
  }, [slug]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: article?.title ?? "Announcement", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Link to="/announcements">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={share} className="gap-1.5">
            <Share2 className="h-4 w-4" /> Share
          </Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !article ? (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-2">Announcement not found</h1>
            <p className="text-muted-foreground">It may have been unpublished or removed.</p>
          </div>
        ) : (
          <article>
            {article.cover_url && (
              <img
                src={article.cover_url}
                alt={article.title}
                className="w-full rounded-xl mb-6 aspect-[16/9] object-cover border border-border/60"
              />
            )}

            <div className="flex items-center gap-3 mb-3 text-sm">
              <Badge variant="outline" className={priorityStyles[article.priority]}>
                {article.priority}
              </Badge>
              <span className="text-muted-foreground">
                {new Date(article.created_at).toLocaleString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
              {article.title}
            </h1>

            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/85 leading-relaxed text-[15px]">
              {article.content}
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NewsArticle;
