import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { GlassCard, PageHero, Reveal } from "@/components/site/ui-kit";
import { Images, Play } from "lucide-react";

type Item = {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  category: string | null;
  media_type: string | null;
  video_url: string | null;
  video_provider: string | null;
};

/** Extract a YouTube video ID from common URL forms. */
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/** Extract a Twitch video/clip id + type from common URL forms. */
function twitchEmbed(url: string): { embed: string; isClip: boolean } | null {
  const clip = url.match(/clips\.twitch\.tv\/([\w-]+)/) || url.match(/twitch\.tv\/\w+\/clip\/([\w-]+)/);
  if (clip) return { embed: `https://clips.twitch.tv/embed?clip=${clip[1]}&parent=${location.hostname}`, isClip: true };
  const vid = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (vid) return { embed: `https://player.twitch.tv/?video=${vid[1]}&parent=${location.hostname}`, isClip: false };
  return null;
}

/** Derive a thumbnail URL for a video item. */
function videoThumb(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) return `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

function VideoEmbed({ url, className }: { url: string; className?: string }) {
  const yt = youtubeId(url);
  if (yt) {
    return (
      <iframe
        className={className}
        src={`https://www.youtube.com/embed/${yt}`}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  const tw = twitchEmbed(url);
  if (tw) {
    return (
      <iframe
        className={className}
        src={tw.embed}
        title="Twitch clip"
        allowFullScreen
      />
    );
  }
  return (
    <div className={className + " flex items-center justify-center bg-muted text-muted-foreground text-sm"}>
      Unsupported video URL
    </div>
  );
}

export default function Gallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState<Item | null>(null);
  const [category, setCategory] = useState<string>("all");

  useEffect(() => {
    supabase
      .from("gallery_items")
      .select("id, title, caption, image_url, category, media_type, video_url, video_provider")
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

  const isVideo = (it: Item) => it.media_type === "video" || (it.video_url && !it.image_url);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Gallery — Warden Network</title>
        <meta name="description" content="Screenshots, builds, and event highlights from the Warden Network community." />
      </Helmet>
      <Navbar />
      <main className="flex-1">
        <PageHero
          eyebrow={<><Images className="h-3 w-3 mr-1" /> Community</>}
          title="The"
          highlight="Gallery"
          description="Screenshots, builds and event highlights captured by the Warden Network community."
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
              <p className="text-muted-foreground">No media yet.</p>
            </GlassCard>
          ) : (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
              {filtered.map((it, i) => {
                const video = isVideo(it);
                const thumb = video && it.video_url ? videoThumb(it.video_url) : null;
                const imgSrc = video ? (thumb ?? it.image_url) : it.image_url;
                return (
                  <Reveal key={it.id} delay={(i % 8) * 40} className="mb-4 break-inside-avoid">
                    <button
                      onClick={() => setOpen(it)}
                      className="group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/50"
                    >
                      <img
                        src={imgSrc}
                        alt={it.title || it.caption || "Gallery media"}
                        loading="lazy"
                        className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {video && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-background/70 backdrop-blur-md border border-primary/40 text-primary shadow-lg transition-transform duration-300 group-hover:scale-110">
                            <Play className="h-6 w-6 ml-1 fill-current" />
                          </span>
                        </div>
                      )}
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
                );
              })}
            </div>
          )}
        </section>
      </main>
      <Footer />

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          {open && (
            <div className="space-y-3">
              {isVideo(open) && open.video_url ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                  <VideoEmbed url={open.video_url} className="h-full w-full" />
                </div>
              ) : (
                <img src={open.image_url} alt={open.title || ""} className="w-full rounded-xl" />
              )}
              {open.title && <h2 className="font-display text-xl font-bold">{open.title}</h2>}
              {open.caption && <p className="text-muted-foreground">{open.caption}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
