import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Helmet } from "react-helmet-async";

type Article = { title: string; content: string; category: string | null; excerpt: string | null; updated_at: string };

export default function WikiArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from("wiki_articles")
      .select("title, content, category, excerpt, updated_at")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        setArticle(data as Article | null);
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <main className="container mx-auto p-6">Loading...</main>;
  if (!article) return <main className="container mx-auto p-6"><p>Article not found.</p><Link className="underline" to="/wiki">Back to wiki</Link></main>;

  return (
    <main className="container mx-auto p-6 max-w-3xl space-y-4">
      <Helmet>
        <title>{article.title} — Wiki</title>
        {article.excerpt && <meta name="description" content={article.excerpt} />}
      </Helmet>
      <Link to="/wiki" className="text-sm text-muted-foreground hover:underline">← Wiki</Link>
      <header>
        {article.category && <div className="text-xs uppercase tracking-wider text-muted-foreground">{article.category}</div>}
        <h1 className="text-3xl font-bold">{article.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">Updated {new Date(article.updated_at).toLocaleDateString()}</p>
      </header>
      <article className="prose prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content || ""}</ReactMarkdown>
      </article>
    </main>
  );
}
