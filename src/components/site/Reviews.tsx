import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, Trash2, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  mc_username: string | null;
};

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(3, "Tell us a bit more").max(1000, "Max 1000 characters"),
});

const StarRow = ({
  value,
  onChange,
  size = "h-5 w-5",
  readOnly = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: string;
  readOnly?: boolean;
}) => (
  <div className="flex gap-1 text-primary">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={readOnly}
        onClick={() => onChange?.(n)}
        aria-label={`${n} star${n === 1 ? "" : "s"}`}
        className={readOnly ? "cursor-default" : "transition hover:scale-110"}
      >
        <Star className={`${size} ${n <= value ? "fill-current" : "opacity-30"}`} />
      </button>
    ))}
  </div>
);

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    const list = (data ?? []) as Review[];
    setReviews(list);
    const ids = [...new Set(list.map((r) => r.user_id))];
    if (ids.length) {
      const { data: ps } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, mc_username")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (ps ?? []).forEach((p: any) => (map[p.id] = p));
      setProfiles(map);
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("public-reviews")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const myReview = user ? reviews.find((r) => r.user_id === user.id) : null;

  useEffect(() => {
    if (myReview && editing) {
      setRating(myReview.rating);
      setBody(myReview.body);
    }
  }, [editing, myReview]);

  const submit = async () => {
    if (!user) return toast.error("Sign in to leave a review");
    const parsed = reviewSchema.safeParse({ rating, body });
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    try {
      if (myReview) {
        const { error } = await supabase
          .from("reviews")
          .update({ rating: parsed.data.rating, body: parsed.data.body })
          .eq("id", myReview.id);
        if (error) throw error;
        toast.success("Review updated");
      } else {
        const { error } = await supabase
          .from("reviews")
          .insert({ user_id: user.id, rating: parsed.data.rating, body: parsed.data.body });
        if (error) throw error;
        toast.success("Review posted");
        setBody("");
        setRating(5);
      }
      setEditing(false);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Could not save review");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!myReview) return;
    if (!confirm("Delete your review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", myReview.id);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
    setBody("");
    setRating(5);
    setEditing(false);
    load();
  };

  const avatarFor = (p?: Profile, fallback?: string) => {
    if (p?.avatar_url) return p.avatar_url;
    if (p?.mc_username) return `https://mc-heads.net/avatar/${p.mc_username}/64`;
    return null;
  };

  const showForm = !myReview || editing;

  const avg = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Average rating summary */}
      {reviews.length > 0 && (
        <Card className="p-6 border-border/60 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="font-display text-5xl font-bold text-gradient leading-none">
              {avg.toFixed(1)}
            </div>
            <div>
              <div className="flex gap-1 text-primary mb-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-5 w-5 ${n <= Math.round(avg) ? "fill-current" : "opacity-30"}`}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Based on {reviews.length} review{reviews.length === 1 ? "" : "s"}
              </div>
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Community rating
          </div>
        </Card>
      )}

      {/* Submission card */}
      <Card className="p-6 border-border/60">
        {!user ? (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-display font-bold text-lg">Share your experience</div>
              <p className="text-sm text-muted-foreground">Sign in to leave a review for ZyphoraMC.</p>
            </div>
            <Link to="/auth">
              <Button>Sign in to review</Button>
            </Link>
          </div>
        ) : showForm ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-display font-bold text-lg">
                  {myReview ? "Edit your review" : "Leave a review"}
                </div>
                <p className="text-sm text-muted-foreground">Be honest — others rely on it.</p>
              </div>
              <StarRow value={rating} onChange={setRating} />
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="What do you love about ZyphoraMC?"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{body.length}/1000</span>
              <div className="flex gap-2">
                {myReview && editing && (
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                )}
                <Button size="sm" onClick={submit} disabled={submitting}>
                  <Check className="h-4 w-4 mr-1" />
                  {submitting ? "Saving..." : myReview ? "Update" : "Post review"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="font-display font-bold text-lg">Thanks for your review!</div>
              <p className="text-sm text-muted-foreground">You can edit or remove it anytime.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={remove}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Review list */}
      {reviews.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground border-border/60">
          No reviews yet — be the first!
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((r) => {
            const p = profiles[r.user_id];
            const name = p?.display_name ?? p?.mc_username ?? "Player";
            const av = avatarFor(p);
            return (
              <Card key={r.id} className="p-6 hover-lift border-border/60 relative">
                <div className="mb-3">
                  <StarRow value={r.rating} readOnly size="h-4 w-4" />
                </div>
                <p className="text-sm text-muted-foreground italic mb-5 line-clamp-6">"{r.body}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                  {av ? (
                    <img src={av} alt={name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-bold text-primary-foreground">
                      {name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <Link to={`/user/${r.user_id.slice(0, 8)}`} className="font-semibold text-sm hover:text-primary truncate block">
                      {name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reviews;
