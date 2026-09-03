import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, Images, ArrowRight } from "lucide-react";

type Item = {
  id: string;
  title: string | null;
  caption: string | null;
  image_url: string;
  media_type: string;
  video_provider: string | null;
  video_url: string | null;
};

/** Turns a Twitch/YouTube link into an embeddable src, or null if we can't. */
const embedSrc = (item: Item): string | null => {
  const url = item.video_url ?? "";
  if (!url) return null;
  const provider = (item.video_provider ?? "").toLowerCase();
  if (provider.includes("youtube") || /youtu\.?be/.test(url)) {
    const id = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (provider.includes("twitch") || /twitch\.tv/.test(url)) {
    const clip = url.match(/clips\.twitch\.tv\/([\w-]+)/)?.[1] ?? url.match(/\/clip\/([\w-]+)/)?.[1];
    if (clip) return `https://clips.twitch.tv/embed?clip=${clip}&parent=${window.location.hostname}&autoplay=false`;
    const vid = url.match(/videos\/(\d+)/)?.[1];
    if (vid) return `https://player.twitch.tv/?video=${vid}&parent=${window.location.hostname}&autoplay=false`;
  }
  return null;
};

/** Trailer + real world screenshots — the homepage was pure text before this. */
const Showcase = () => {
  const [videos, setVideos] = useState<Item[]>([]);
  const [shots, setShots] = useState<Item[]>([]);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    supabase
      .from("gallery_items")
      .select("id, title, caption, image_url, media_type, video_provider, video_url")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .limit(24)
      .then(({ data }) => {
        const rows = (data as Item[]) ?? [];
        setVideos(rows.filter((r) => r.media_type === "video" && embedSrc(r)));
        setShots(rows.filter((r) => r.media_type !== "video" && r.image_url).slice(0, 6));
      });
  }, []);

  const trailer = videos[0];
  const src = trailer ? embedSrc(trailer) : null;

  if (!trailer && shots.length === 0) return null;

  return (
    <section className="space-y-10">
      {trailer && src && (
        <div>
          <div className="text-center mb-6">
            <div className="text-[10px] font-mono tracking-widest uppercase text-primary mb-2">Watch</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">
              {trailer.title || "See Warden Network in action"}
            </h2>
          </div>
          <div className="relative rounded-xl overflow-hidden border border-primary/20 bg-card aspect-video max-w-4xl mx-auto">
            {playing ? (
              <iframe
                src={`${src}${src.includes("?") ? "&" : "?"}autoplay=1`}
                title={trailer.title ?? "Warden Network trailer"}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 w-full h-full"
                aria-label="Play trailer"
              >
                {trailer.image_url && (
                  <img
                    src={trailer.image_url}
                    alt={trailer.title ?? "Warden Network trailer thumbnail"}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition"
                  />
                )}
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-16 w-16 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center group-hover:scale-110 transition shadow-lg">
                    <Play className="h-7 w-7 ml-1" fill="currentColor" />
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {shots.length > 0 && (
        <div>
          <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
            <div>
              <div className="text-[10px] font-mono tracking-widest uppercase text-primary mb-2">The world</div>
              <h2 className="font-display text-2xl md:text-3xl font-bold">Straight from the server</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/gallery">
                <Images className="h-4 w-4 mr-1.5" /> Full gallery <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {shots.map((s) => (
              <Link
                key={s.id}
                to="/gallery"
                className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-border hover:border-primary/50 transition"
              >
                <img
                  src={s.image_url}
                  alt={s.title || s.caption || "Warden Network world screenshot"}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                {(s.title || s.caption) && (
                  <span className="absolute inset-x-0 bottom-0 p-2 text-xs bg-gradient-to-t from-background/90 to-transparent truncate">
                    {s.title || s.caption}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Showcase;
