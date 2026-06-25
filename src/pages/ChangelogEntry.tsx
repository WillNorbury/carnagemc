import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Wrench, Bug, Zap, ShieldCheck, Plus, ArrowLeft } from "lucide-react";
import { changelogSlug } from "@/lib/changelog-slug";

type Entry = {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string | null;
  entry_date: string;
};

const CATEGORIES: Record<string, { label: string; icon: any; cls: string }> = {
  feature: { label: "Feature", icon: Sparkles, cls: "text-primary border-primary/40" },
  update: { label: "Update", icon: Zap, cls: "text-accent border-accent/40" },
  fix: { label: "Bug Fix", icon: Bug, cls: "text-orange-400 border-orange-400/40" },
  balance: { label: "Balance", icon: Wrench, cls: "text-blue-400 border-blue-400/40" },
  security: { label: "Security", icon: ShieldCheck, cls: "text-emerald-400 border-emerald-400/40" },
  addition: { label: "Addition", icon: Plus, cls: "text-purple-400 border-purple-400/40" },
};

const ChangelogEntry = () => {
  const { slug = "" } = useParams();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("changelog_entries")
        .select("id,title,content,category,version,entry_date")
        .eq("published", true)
        .order("entry_date", { ascending: false });
      const list = (data as Entry[]) ?? [];
      const match = list.find((e) => changelogSlug(e.title) === slug);
      if (match) {
        setEntry(match);
        document.title = `${match.title} — Changelog — CarnageMC`;
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [slug]);

  const meta = entry ? CATEGORIES[entry.category] ?? { label: entry.category, icon: Zap, cls: "text-muted-foreground border-border" } : null;
  const Icon = meta?.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        <div className="container max-w-3xl">
          <Button asChild variant="ghost" size="sm" className="mb-6">
            <Link to="/changelog">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to changelog
            </Link>
          </Button>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : notFound || !entry ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground mb-4">Changelog entry not found.</p>
              <Button asChild>
                <Link to="/changelog">View all entries</Link>
              </Button>
            </Card>
          ) : (
            <Card className="p-6 md:p-8">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {meta && Icon && (
                  <Badge variant="outline" className={meta.cls}>
                    <Icon className="h-3 w-3 mr-1" />
                    {meta.label}
                  </Badge>
                )}
                {entry.version && (
                  <Badge variant="secondary" className="font-mono">v{entry.version}</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.entry_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-black mb-6">{entry.title}</h1>
              <div className="prose prose-invert max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-code:text-accent">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
              </div>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangelogEntry;
