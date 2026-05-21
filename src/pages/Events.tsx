import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin, Clock } from "lucide-react";

type Event = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  cover_url: string | null;
  category: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const Countdown = ({ to }: { to: string }) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = new Date(to).getTime() - now;
  if (diff <= 0) return <span className="text-primary">Live now</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return (
    <span className="font-mono">
      {d > 0 && `${d}d `}
      {h}h {m}m
    </span>
  );
};

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    document.title = "Events — XyloMC";
    (supabase.from("events" as any) as any)
      .select("id,title,slug,description,location,starts_at,ends_at,cover_url,category")
      .eq("published", true)
      .order("starts_at", { ascending: true })
      .then(({ data }: any) => {
        setEvents((data as Event[]) ?? []);
        setLoading(false);
      });
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const upcoming: Event[] = [];
    const past: Event[] = [];
    events.forEach((e) => {
      const end = e.ends_at ? new Date(e.ends_at).getTime() : new Date(e.starts_at).getTime() + 3600000;
      if (end >= now) upcoming.push(e);
      else past.push(e);
    });
    past.reverse();
    return { upcoming, past };
  }, [events]);

  const list = tab === "upcoming" ? upcoming : past;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-28 pb-10">
          <div className="absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="container relative text-center">
            <Badge variant="secondary" className="mb-4 text-primary border-primary/40">
              <Calendar className="h-3 w-3 mr-1" /> Server Events
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl font-black mb-3">
              Up<span className="text-gradient">coming</span> Events
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tournaments, drops, resets, and community gatherings on XyloMC.
            </p>
          </div>
        </section>

        <div className="container pb-20 max-w-5xl">
          <div className="flex gap-2 justify-center mb-8">
            <Button size="sm" variant={tab === "upcoming" ? "default" : "outline"} onClick={() => setTab("upcoming")}>
              Upcoming ({upcoming.length})
            </Button>
            <Button size="sm" variant={tab === "past" ? "default" : "outline"} onClick={() => setTab("past")}>
              Past ({past.length})
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading…</p>
          ) : list.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-muted-foreground">
                {tab === "upcoming" ? "No upcoming events. Check back soon!" : "No past events yet."}
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-5">
              {list.map((e) => (
                <Card key={e.id} className="overflow-hidden hover:border-primary/40 transition group">
                  {e.cover_url && (
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      <img
                        src={e.cover_url}
                        alt={e.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <Badge variant="outline" className="mb-2 capitalize">
                      {e.category}
                    </Badge>
                    <h3 className="font-display font-bold text-lg mb-2">{e.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3 whitespace-pre-wrap">
                      {e.description}
                    </p>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(e.starts_at)}
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" />
                          {e.location}
                        </div>
                      )}
                      {tab === "upcoming" && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <Clock className="h-3 w-3" />
                          <Countdown to={e.starts_at} />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
