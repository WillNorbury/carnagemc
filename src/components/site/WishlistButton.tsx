import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Props = {
  itemId: string;
  className?: string;
  size?: "sm" | "md";
};

export function WishlistButton({ itemId, className = "", size = "md" }: Props) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setSaved(false);
        setReady(true);
        return;
      }
      const { data } = await supabase
        .from("store_wishlists")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .maybeSingle();
      if (cancelled) return;
      setSaved(!!data);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, itemId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.message("Sign in to save items to your wishlist.");
      nav("/auth?next=/store");
      return;
    }
    setLoading(true);
    if (saved) {
      const { error } = await supabase
        .from("store_wishlists")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", itemId);
      setLoading(false);
      if (error) return toast.error(error.message);
      setSaved(false);
      toast.success("Removed from wishlist");
    } else {
      const { error } = await supabase
        .from("store_wishlists")
        .insert({ user_id: user.id, item_id: itemId });
      setLoading(false);
      if (error) return toast.error(error.message);
      setSaved(true);
      toast.success("Saved to wishlist");
    }
  };

  const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading || !ready}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`inline-flex items-center justify-center transition ${
        saved ? "text-[#ff5722]" : "text-[#9ca3af] hover:text-[#ff5722]"
      } ${className}`}
    >
      <Heart className={dim} fill={saved ? "currentColor" : "none"} strokeWidth={1.75} />
    </button>
  );
}

export default WishlistButton;
