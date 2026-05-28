import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import PageLoader from "@/components/site/PageLoader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Boxes, Star, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

type Mod = {
  id: string;
  short_id: string;
  name: string;
  description: string | null;
  loader: string | null;
  mc_version: string | null;
  icon_url: string | null;
};

type Review = {
  id: string;
  mod_id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
};

const TIERS = [
  { tier: "S", min: 4.5, label: "Legendary", color: "from-yellow-500/30 to-orange-500/20 border-yellow-500/40" },
  { tier: "A", min: 3.5, label: "Great", color: "from-emerald-500/30 to-teal-500/20 border-emerald-500/40" },
  { tier: "B", min: 2.5, label: "Good", color: "from-sky-500/30 to-blue-500/20 border-sky-500/40" },
  { tier: "C", min: 1.5, label: "Okay", color: "from-purple-500/30 to-fuchsia-500/20 border-purple-500/40" },
  { tier: "D", min: 0, label: "Poor", color: "from-rose-500/30 to-red-500/20 border-rose-500/40" },
];

const Stars = ({
  value,
  onChange,
  size = "h-5 w-5",
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: string;
}) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={!onChange}
        onClick={() => onChange?.(n)}
        className={onChange ? "cursor-pointer transition hover:scale-110" : "cursor-default"}
        aria-label={`${n} stars`}
      >
        <Star
          className={`${size} ${
            n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
          }`}
        />
      </button>
    ))}
  </div>
);

const ModTiers = () => {
  const { user } = useAuth();
  const [mods, setMods] = useState<Mod[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMod, setOpenMod] = useState<Mod | null>(null);
  const [myRating, setMyRating] = useState(5);
  const [myBody, setMyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    const [modsRes, reviewsRes] = await Promise.all([
      (supabase.from("mods" as any) as any)
        .select("id, short_id, name, description, loader, mc_version, icon_url")
        .eq("published", true),
      (supabase.from("mod_reviews" as any) as any).select("*"),
    ]);
    setMods((modsRes.data ?? []) as Mod[]);
    setReviews((reviewsRes.data ?? []) as Review[]);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Mod Tier List — XyloMC";
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const map = new Map<string, { sum: number; count: number; avg: number }>();
    reviews.forEach((r) => {
      const s = map.get(r.mod_id) ?? { sum: 0, count: 0, avg: 0 };
      s.sum += r.rating;
      s.count += 1;
      s.avg = s.sum / s.count;
      map.set(r.mod_id, s);
    });
    return map;
  }, [reviews]);

  const tieredMods = useMemo(() => {
    return TIERS.map((t) => {
      const list = mods
        .filter((m) => {
          const s = stats.get(m.id);
          const avg = s?.avg ?? 0;
          const nextMin =
            TIERS[TIERS.findIndex((x) => x.tier === t.tier) - 1]?.min ?? Infinity;
          // Unrated mods land in the lowest visible bucket only if t is D and they have no reviews
          if (!s) return t.tier === "D" ? false : false;
          return avg >= t.min && avg < nextMin;
        })
        .sort((a, b) => (stats.get(b.id)!.avg - stats.get(a.id)!.avg));
      return { ...t, mods: list };
    });
  }, [mods, stats]);

  const unrated = useMemo(() => mods.filter((m) => !stats.get(m.id)), [mods, stats]);

  const openReview = (m: Mod) => {
    setOpenMod(m);
    const mine = reviews.find((r) => r.mod_id === m.id && r.user_id === user?.id);
    setMyRating(mine?.rating ?? 5);
    setMyBody(mine?.body ?? "");
  };

  const submitReview = async () => {
    if (!user || !openMod) return;
    setSubmitting(true);
    const { error } = await (supabase.from("mod_reviews" as any) as any).upsert(
      {
        mod_id: openMod.id,
        user_id: user.id,
        rating: myRating,
        body: myBody.trim().slice(0, 1000),
      },
      { onConflict: "mod_id,user_id" }
    );
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Review saved");
    setOpenMod(null);
    loadAll();
  };

  const deleteMine = async () => {
    if (!user || !openMod) return;
    const { error } = await (supabase.from("mod_reviews" as any) as any)
      .delete()
      .eq("mod_id", openMod.id)
      .eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Review removed");
    setOpenMod(null);
    loadAll();
  };

  const ModCard = ({ m }: { m: Mod }) => {
    const s = stats.get(m.id);
    const mine = reviews.find((r) => r.mod_id === m.id && r.user_id === user?.id);
    return (
      <Card className="p-3 flex items-center gap-3 hover:border-primary/50 transition">
        {m.icon_url ? (
          <img src={m.icon_url} alt="" className="h-12 w-12 rounded-md object-cover border border-border shrink-0" />
        ) : (
          <div className="h-12 w-12 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <Boxes className="h-6 w-6 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link to="/mods" className="font-display font-semibold truncate hover:text-primary block">
            {m.name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <Stars value={Math.round(s?.avg ?? 0)} size="h-3.5 w-3.5" />
            <span className="text-xs text-muted-foreground">
              {s ? `${s.avg.toFixed(1)} · ${s.count}` : "No ratings"}
            </span>
          </div>
          <div className="flex gap-1 mt-1">
            {m.loader && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.loader}</Badge>}
            {m.mc_version && <Badge variant="outline" className="text-[10px] px-1.5 py-0">MC {m.mc_version}</Badge>}
          </div>
        </div>
        <Button size="sm" variant={mine ? "secondary" : "outline"} onClick={() => openReview(m)}>
          {mine ? "Edit" : "Rate"}
        </Button>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageLoader loading={loading} label="Loading tier list" />
      <Navbar />
      <main className="container pt-28 pb-16">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs uppercase tracking-wider text-primary mb-4">
            <Trophy className="h-3.5 w-3.5" /> Community Tier List
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            Mod <span className="text-gradient">Tier List</span>
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Rate mods from 1 to 5 stars and leave a review. Rankings are aggregated from the community.
          </p>
          {!user && (
            <p className="mt-3 text-sm">
              <Link to="/auth" className="text-primary underline">Sign in</Link> to rate and review.
            </p>
          )}
        </header>

        <div className="space-y-4">
          {tieredMods.map((row) => (
            <div
              key={row.tier}
              className={`rounded-xl border bg-gradient-to-r ${row.color} p-4 flex gap-4`}
            >
              <div className="flex flex-col items-center justify-center w-16 shrink-0">
                <div className="text-4xl font-display font-black">{row.tier}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</div>
              </div>
              <div className="flex-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {row.mods.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic self-center">No mods in this tier yet.</p>
                ) : (
                  row.mods.map((m) => <ModCard key={m.id} m={m} />)
                )}
              </div>
            </div>
          ))}

          {unrated.length > 0 && (
            <div className="rounded-xl border border-border bg-card/40 p-4 flex gap-4">
              <div className="flex flex-col items-center justify-center w-16 shrink-0">
                <div className="text-2xl font-display font-black text-muted-foreground">?</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Unrated</div>
              </div>
              <div className="flex-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {unrated.map((m) => <ModCard key={m.id} m={m} />)}
              </div>
            </div>
          )}

          {!loading && mods.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              No mods to rank yet. Add some in the <Link to="/admin/mods" className="text-primary underline">admin area</Link>.
            </p>
          )}
        </div>

        {/* Recent reviews */}
        {reviews.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-display font-bold mb-4">Recent reviews</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[...reviews]
                .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                .slice(0, 8)
                .filter((r) => r.body.trim().length > 0)
                .map((r) => {
                  const m = mods.find((x) => x.id === r.mod_id);
                  if (!m) return null;
                  return (
                    <Card key={r.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{m.name}</span>
                        <Stars value={r.rating} size="h-3.5 w-3.5" />
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.body}</p>
                    </Card>
                  );
                })}
            </div>
          </section>
        )}
      </main>
      <Footer />

      <Dialog open={!!openMod} onOpenChange={(o) => !o && setOpenMod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rate {openMod?.name}</DialogTitle>
          </DialogHeader>
          {!user ? (
            <p className="text-sm text-muted-foreground">
              Please <Link to="/auth" className="text-primary underline">sign in</Link> to leave a rating.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Your rating</label>
                <Stars value={myRating} onChange={setMyRating} size="h-8 w-8" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Review (optional)</label>
                <Textarea
                  value={myBody}
                  onChange={(e) => setMyBody(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="Share your thoughts..."
                />
                <div className="text-xs text-muted-foreground mt-1 text-right">{myBody.length}/1000</div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {user && reviews.find((r) => r.mod_id === openMod?.id && r.user_id === user.id) && (
              <Button variant="destructive" onClick={deleteMine}>Delete</Button>
            )}
            <Button variant="outline" onClick={() => setOpenMod(null)}>Cancel</Button>
            {user && (
              <Button onClick={submitReview} disabled={submitting}>
                {submitting ? "Saving..." : "Save review"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModTiers;
