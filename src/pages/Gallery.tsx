import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { GlassCard, PageHero, Reveal } from "@/components/site/ui-kit";
import { Images } from "lucide-react";

type Item = { id: string; title: string | null; caption: string | null; image_url: string; category: string | null };

export default function Gallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<Item | null>(null);
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("gallery_items")
      .select("id, title, caption, image_url, category")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Item[]) ?? []));
  }, []);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean) as string[]))],
    [items],
  );

  const filtered = useMemo(
    () => (category === "all" ? items : items.filter((i) => i.category === category)),
    [items, category],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Gallery — CarnageMC</title>
        <meta name="description" content="Screenshots, builds, and event highlights from the CarnageMC community." />
      </Helmet>
      <Navbar />
      <main className="flex-1">
        <PageHero
          eyebrow={<><Images className="h-3 w-3 mr-1" /> Community</>}
          title="The"
          highlight="Gallery"
          description="Screenshots, builds and event highlights captured by the CarnageMC community."
        />

        <section className="container pb-24">
          {categories.length > 2 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={category === c ? "premium" : "glass"}
                  className="rounded-full capitalize"
                  onClick={() => setCategory(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <p className="text-muted-foreground">No images yet.</p>
            </GlassCard>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
              {filtered.map((it, i) => (
                <Reveal key={it.id} delay={(i % 8) * 40} className="mb-4 break-inside-avoid">
                  <button
                    onClick={() => setOpen(it)}
                    className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
                  >
                    <img
                      src={it.image_url}
                      alt={it.title || it.caption || "Gallery image"}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {(it.title || it.caption) && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/70 to-transparent p-3 text-left opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        {it.title && <div className="text-sm font-semibold truncate">{it.title}</div>}
                        {it.caption && (
                          <div className="text-xs text-muted-foreground truncate">{it.caption}</div>
                        )}
                      </div>
                    )}
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          {open && (
            <div className="space-y-3">
              <img src={open.image_url} alt={open.title || ""} className="w-full rounded-xl" />
              {open.title && <h2 className="font-display text-xl font-bold">{open.title}</h2>}
              {open.caption && <p className="text-muted-foreground">{open.caption}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
