import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { confirm } from "@/lib/confirm";
import { userProfilePath } from "@/lib/userSlug";
import { Star, Trash2, Loader2, MessageSquare } from "lucide-react";

export type ReviewTarget = "discover_item" | "plugin";

type Review = {
  id: string;
  target_type: ReviewTarget;
  target_id: string;
  user_id: string;
  rating: number;
  body: string;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  mc_username: string | null;
};

const Stars = ({
  value,
  size = 16,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (n: number) => void;
}) => (
  <div className="inline-flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={!onChange}
        onClick={() => onChange?.(n)}
        className={onChange ? "cursor-pointer" : "cursor-default"}
        aria-label={`${n} star${n === 1 ? "" : "s"}`}
      >
        <Star
          style={{ width: size, height: size }}
          className={
            n <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground/40"
          }
        />
      </button>
    ))}
  </div>
);

type Props = {
  targetType: ReviewTarget;
  targetId: string;
};

const ItemReviews = ({ targetType, targetId }: Props) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("item_reviews")
      .select("*")
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Review[];
    setReviews(list);
    const ids = Array.from(new Set(list.map((r) => r.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, mc_username")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      ((profs ?? []) as Profile[]).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  const myReview = useMemo(
    () => reviews.find((r) => r.user_id === user?.id) ?? null,
    [reviews, user?.id],
  );

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body);
    }
  }, [myReview]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  }, [reviews]);

  const submit = async () => {
    if (!user) {
      toast.error("Sign in to leave a review");
      return;
    }
    if (rating < 1 || rating > 5) return toast.error("Pick a rating");
    setSaving(true);
    const payload = {
      target_type: targetType,
      target_id: targetId,
      user_id: user.id,
      rating,
      body: body.trim(),
    };
    const { error } = await supabase
      .from("item_reviews")
      .upsert(payload, { onConflict: "target_type,target_id,user_id" });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(myReview ? "Review updated" : "Review posted");
    load();
  };

  const remove = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete review?",
        description: "This will permanently remove your review.",
        confirmText: "Delete",
        destructive: true,
      }))
    )
      return;
    const { error } = await supabase.from("item_reviews").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Review deleted");
    if (myReview?.id === id) {
      setRating(5);
      setBody("");
    }
    load();
  };

  return (
    <Card className="p-5 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">
            Reviews{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({reviews.length})
            </span>
          </h3>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars value={Math.round(avg)} />
            <span className="font-medium">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground">/ 5</span>
          </div>
        )}
      </div>

      {user ? (
        <div className="space-y-3 rounded-lg border border-border bg-card/60 p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Your rating:</span>
            <Stars value={rating} size={20} onChange={setRating} />
          </div>
          <Textarea
            rows={3}
            placeholder="Share what you think about this..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
          />
          <div className="flex justify-end gap-2">
            {myReview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(myReview.id)}
                disabled={saving}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button size="sm" onClick={submit} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : null}
              {myReview ? "Update review" : "Post review"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No reviews yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const p = profiles[r.user_id];
            const name = p?.display_name ?? p?.mc_username ?? "Anonymous";
            const initials = name.slice(0, 2).toUpperCase();
            const avatar =
              p?.avatar_url ||
              (p?.mc_username
                ? `https://mc-heads.net/avatar/${p.mc_username}/64`
                : undefined);
            return (
              <div
                key={r.id}
                className="rounded-lg border border-border bg-background/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <Link to={p ? userProfilePath(p) : "#"}>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {p ? (
                          <Link
                            to={userProfilePath(p)}
                            className="font-medium hover:text-primary"
                          >
                            {name}
                          </Link>
                        ) : (
                          <span className="font-medium">{name}</span>
                        )}
                        <Stars value={r.rating} size={14} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.body && (
                      <p className="text-sm text-foreground/90 mt-2 whitespace-pre-wrap">
                        {r.body}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default ItemReviews;
