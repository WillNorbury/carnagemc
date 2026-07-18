import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Star, Loader2, Trash2 } from "lucide-react";

type Review = {
  id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = { id: string; display_name: string | null; avatar_url: string | null };

function StarRow({
  value,
  onChange,
  size = 16,
  interactive = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={`p-0.5 ${interactive ? "cursor-pointer" : "cursor-default"}`}
          aria-label={`${n} star${n === 1 ? "" : "s"}`}
        >
          <Star
            style={{ width: size, height: size }}
            className={
              n <= active
                ? "fill-[#ff5722] text-[#ff5722]"
                : "text-white/20"
            }
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export function StorePackageReviews({ itemId }: { itemId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("item_reviews")
      .select("id, user_id, rating, body, created_at, updated_at")
      .eq("target_type", "store_item")
      .eq("target_id", itemId)
      .order("created_at", { ascending: false });
    const list = (data as Review[]) ?? [];
    setReviews(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: any) => (map[p.id] = p));
      setProfiles(map);
    } else {
      setProfiles({});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const myReview = useMemo(
    () => reviews.find((r) => r.user_id === user?.id) ?? null,
    [reviews, user],
  );

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body ?? "");
    } else {
      setRating(0);
      setBody("");
    }
  }, [myReview?.id]);

  const { avg, count } = useMemo(() => {
    if (!reviews.length) return { avg: 0, count: 0 };
    const sum = reviews.reduce((a, r) => a + (r.rating || 0), 0);
    return { avg: sum / reviews.length, count: reviews.length };
  }, [reviews]);

  const submit = async () => {
    if (!user) {
      toast.message("Sign in to leave a review.");
      return;
    }
    if (rating < 1) {
      toast.error("Pick a star rating first.");
      return;
    }
    setSubmitting(true);
    const payload = {
      target_type: "store_item",
      target_id: itemId,
      user_id: user.id,
      rating,
      body: body.trim() || null,
    };
    let err: any = null;
    if (myReview) {
      const { error } = await supabase
        .from("item_reviews")
        .update({ rating, body: body.trim() || null })
        .eq("id", myReview.id);
      err = error;
    } else {
      const { error } = await supabase.from("item_reviews").insert(payload);
      err = error;
    }
    setSubmitting(false);
    if (err) {
      toast.error(err.message || "Could not save review.");
      return;
    }
    toast.success(myReview ? "Review updated" : "Thanks for your review!");
    await load();
  };

  const remove = async () => {
    if (!myReview) return;
    const { error } = await supabase.from("item_reviews").delete().eq("id", myReview.id);
    if (error) {
      toast.error(error.message || "Could not delete review.");
      return;
    }
    setRating(0);
    setBody("");
    toast.success("Review removed");
    await load();
  };

  return (
    <section className="pt-10 border-t border-white/5">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em] mb-2">
            Reviews
          </h2>
          <div className="flex items-center gap-3">
            <StarRow value={Math.round(avg)} size={18} />
            <div className="font-['Space_Grotesk'] text-lg">
              {count > 0 ? avg.toFixed(1) : "—"}
              <span className="text-xs text-[#9ca3af] font-mono ml-2">
                ({count} review{count === 1 ? "" : "s"})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Write/edit form */}
      <div className="border border-white/10 bg-[#12121a] p-5 space-y-3 mb-6">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#9ca3af] uppercase tracking-widest">
                Your rating:
              </span>
              <StarRow value={rating} onChange={setRating} interactive size={22} />
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 1000))}
              rows={3}
              placeholder="Share your experience with this package (optional)…"
              className="w-full bg-[#0a0a0f] border border-white/10 focus:border-[#ff5722] outline-none text-sm p-3 text-slate-100 placeholder:text-[#5f6472]"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#5f6472]">
                {body.length}/1000
              </span>
              <div className="flex items-center gap-2">
                {myReview && (
                  <button
                    type="button"
                    onClick={remove}
                    className="inline-flex items-center gap-1.5 px-3 py-2 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-[#9ca3af] hover:border-red-500/40 hover:text-red-300 transition"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || rating < 1}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff5722] text-white text-[10px] font-mono uppercase tracking-widest hover:bg-[#ff5722]/90 disabled:opacity-50 transition"
                >
                  {submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                  {myReview ? "Update review" : "Post review"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-[#9ca3af]">
            <Link to="/auth" className="text-[#ff5722] hover:underline">
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        )}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-[#9ca3af] font-mono">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[#9ca3af]">No reviews yet — be the first!</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => {
            const p = profiles[r.user_id];
            const name = p?.display_name || "Player";
            return (
              <li
                key={r.id}
                className="border border-white/5 bg-[#12121a] p-4 flex gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-[#1a1a24] border border-white/10 overflow-hidden shrink-0">
                  {p?.avatar_url && (
                    <img
                      src={p.avatar_url}
                      alt={name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-['Space_Grotesk'] font-semibold text-sm">
                      {name}
                    </span>
                    <StarRow value={r.rating} size={12} />
                    <span className="text-[10px] font-mono text-[#5f6472]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.body && (
                    <p className="text-sm text-[#cbd5e1] mt-1 whitespace-pre-wrap">
                      {r.body}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
