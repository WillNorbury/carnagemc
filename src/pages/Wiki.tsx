import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

type Article = { id: string; slug: string; title: string; category: string | null; excerpt: string | null };

export default function Wiki() {
  const [items, setItems] = useState<Article[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("wiki_articles")
      .select("id, slug, title, category, excerpt")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true })
      .then(({ data }) => setItems((data as Article[]) ?? []));
  }, []);

  const grouped = useMemo(() => {
    const filtered = items.filter((a) =>
      !q || a.title.toLowerCase().includes(q.toLowerCase()) || (a.excerpt ?? "").toLowerCase().includes(q.toLowerCase())
    );
    const g: Record<string, Article[]> = {};
    for (const a of filtered) {
      const c = a.category || "General";
      (g[c] ||= []).push(a);
    }
    return g;
  }, [items, q]);

  return (
    <main className="container mx-auto p-6 max-w-5xl space-y-6">
      <Helmet>
        <title>Wiki</title>
        <meta name="description" content="Server wiki: guides, mechanics, commands and how-tos." />
      </Helmet>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Wiki</h1>
        <Input placeholder="Search articles..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
      </header>
      {Object.keys(grouped).length === 0 && <p className="text-muted-foreground">No articles yet.</p>}
      {Object.entries(grouped).map(([cat, arr]) => (
        <section key={cat} className="space-y-3">
          <h2 className="text-xl font-semibold">{cat}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {arr.map((a) => (
              <Link key={a.id} to={`/wiki/${a.slug}`}>
                <Card className="hover:border-primary transition-colors h-full">
                  <CardContent className="p-4">
                    <div className="font-medium">{a.title}</div>
                    {a.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
