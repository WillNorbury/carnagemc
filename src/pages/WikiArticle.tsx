import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto p-6 max-w-3xl space-y-4">
        {loading ? (
          <p>Loading...</p>
        ) : !article ? (
          <>
            <p>Article not found.</p>
            <Link className="underline" to="/wiki">Back to wiki</Link>
          </>
        ) : (
          <>
            <Helmet>
              <title>{article.title} — Wiki — CarnageMC</title>
              {article.excerpt && <meta name="description" content={article.excerpt} />}
              <link rel="canonical" href={`https://www.carnagemc.net/wiki/${slug}`} />
              <meta property="og:title" content={`${article.title} — Wiki`} />
              {article.excerpt && <meta property="og:description" content={article.excerpt} />}
              <meta property="og:type" content="article" />
              <meta property="og:url" content={`https://www.carnagemc.net/wiki/${slug}`} />
              <script type="application/ld+json">{JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Article",
                headline: article.title,
                datePublished: article.updated_at,
                dateModified: article.updated_at,
                articleSection: article.category || undefined,
                description: article.excerpt || undefined,
                mainEntityOfPage: `https://www.carnagemc.net/wiki/${slug}`,
                publisher: {
                  "@type": "Organization",
                  name: "CarnageMC",
                  logo: { "@type": "ImageObject", url: "https://www.carnagemc.net/icon-512.png" },
                },
              })}</script>
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
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
