import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

type Article = {
  id: string;
  title: string;
  content: string;
  cover_url: string | null;
  created_at: string;
};

const NewsArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("news")
      .select("id,title,content,cover_url,created_at")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data);
        setLoading(false);
        if (data) document.title = `${data.title} — ZyphoraMC`;
      });
  }, [slug]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-28 pb-16 max-w-3xl">
        <Link to="/news">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to news
          </Button>
        </Link>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !article ? (
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-2">Article not found</h1>
            <p className="text-muted-foreground">It may have been unpublished or removed.</p>
          </div>
        ) : (
          <article>
            {article.cover_url && (
              <img
                src={article.cover_url}
                alt={article.title}
                className="w-full rounded-lg mb-8 aspect-video object-cover"
              />
            )}
            <p className="text-sm text-muted-foreground mb-3">
              {new Date(article.created_at).toLocaleDateString()}
            </p>
            <h1 className="text-4xl font-bold tracking-tight mb-6">{article.title}</h1>
            <div className="prose prose-invert max-w-none whitespace-pre-wrap text-foreground/90 leading-relaxed">
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
