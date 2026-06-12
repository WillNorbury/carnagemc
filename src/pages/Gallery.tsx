import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Helmet } from "react-helmet-async";

type Item = { id: string; title: string | null; caption: string | null; image_url: string; category: string | null };

export default function Gallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<Item | null>(null);

  useEffect(() => {
    supabase
      .from("gallery_items")
      .select("id, title, caption, image_url, category")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as Item[]) ?? []));
  }, []);

  return (
    <main className="container mx-auto p-6 space-y-6">
      <Helmet>
        <title>Gallery</title>
        <meta name="description" content="Screenshots, builds, and event highlights from our community." />
      </Helmet>
      <header>
        <h1 className="text-3xl font-bold">Gallery</h1>
        <p className="text-muted-foreground mt-2">Screenshots and builds from our community.</p>
      </header>
      {items.length === 0 && <p className="text-muted-foreground">No images yet.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <button key={it.id} onClick={() => setOpen(it)} className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
            <img src={it.image_url} alt={it.title || it.caption || "Gallery image"} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            {(it.title || it.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
                {it.title && <div className="text-sm text-white font-medium truncate">{it.title}</div>}
              </div>
            )}
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          {open && (
            <div className="space-y-3">
              <img src={open.image_url} alt={open.title || ""} className="w-full rounded" />
              {open.title && <h2 className="text-xl font-semibold">{open.title}</h2>}
              {open.caption && <p className="text-muted-foreground">{open.caption}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
