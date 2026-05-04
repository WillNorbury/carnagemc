import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type News = {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  cover_url: string | null;
  created_at: string;
};

const NewsPage = () => {
  const [items, setItems] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "News — ZyphoraMC";
    supabase
      .from("news")
      .select("id,title,excerpt,slug,cover_url,created_at")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-28 pb-16">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">News & Updates</h1>
          <p className="text-muted-foreground mt-2">
            Patch notes, events, and announcements from the ZyphoraMC team.
          </p>
        </header>

        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">No posts yet — check back soon.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((n) => (
              <Link key={n.id} to={`/news/${n.slug}`}>
                <Card className="overflow-hidden h-full hover:border-primary/50 transition">
                  {n.cover_url && (
                    <img src={n.cover_url} alt={n.title} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground mb-2">
                      {new Date(n.created_at).toLocaleDateString()}
                    </p>
                    <h2 className="font-semibold text-lg leading-snug mb-2">{n.title}</h2>
                    {n.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
                    )}
                  </div>
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
