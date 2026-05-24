import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle, Search, LifeBuoy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlight } from "@/components/site/Highlight";

type Faq = { id: string; question: string; answer: string; category: string; sort_order: number };

const Faq = () => {
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  useEffect(() => {
    document.title = "FAQ — XyloMC";
    (supabase.from("faqs" as any) as any)
      .select("id,question,answer,category,sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .then(({ data }: any) => {
        setItems((data as Faq[]) ?? []);
        setLoading(false);
      });
  }, []);

  const categories = useMemo(() => {
    const s = new Set(items.map((i) => i.category));
    return ["all", ...Array.from(s)];
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (!needle) return true;
      return i.question.toLowerCase().includes(needle) || i.answer.toLowerCase().includes(needle);
    });
  }, [items, q, cat]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-10">
          <div className="absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
              <HelpCircle className="h-3 w-3 mr-1" /> Help Center
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Answers to the most common questions about XyloMC.
            </p>
          </div>
        </section>

        <div className="container pb-20 max-w-3xl">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search questions…"
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={cat === c ? "default" : "outline"}
                onClick={() => setCat(c)}
                className="capitalize"
              >
                {c}
              </Button>
            ))}
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">No matching questions.</p>
            </Card>
          ) : (
            <Card className="p-2">
              <Accordion type="single" collapsible className="w-full">
                {filtered.map((f) => (
                  <AccordionItem key={f.id} value={f.id} className="px-3">
                    <AccordionTrigger className="text-left">
                      <span className="flex-1">{f.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground whitespace-pre-wrap">
                      {f.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          )}

          <Card className="mt-8 p-6 text-center">
            <LifeBuoy className="h-6 w-6 mx-auto mb-2 text-primary" />
            <h3 className="font-display font-bold mb-1">Still need help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Open a ticket and our staff will get back to you.
            </p>
            <Button asChild>
              <Link to="/support">Contact Support</Link>
            </Button>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Faq;
