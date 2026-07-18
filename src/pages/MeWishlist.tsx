import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Heart, Package, ArrowLeft, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import { WishlistButton } from "@/components/site/WishlistButton";

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  category_id: string;
};

const formatPrice = (p: number | null, c?: string | null) => {
  if (p == null) return "";
  const cur = (c || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(Number(p));
  } catch {
    return `${cur} ${Number(p).toFixed(2)}`;
  }
};

export default function MeWishlist() {
  const { user, loading: authLoading } = useAuth();
  const cart = useCart();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data: rows } = await supabase
        .from("store_wishlists")
        .select("item_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      const ids = (rows ?? []).map((r) => r.item_id);
      if (ids.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }
      const { data: its } = await supabase
        .from("store_items")
        .select("id, name, description, price, currency, image_url, category_id, published")
        .in("id", ids)
        .eq("published", true);
      const map = new Map((its ?? []).map((i: any) => [i.id, i as Item]));
      setItems(ids.map((id) => map.get(id)).filter(Boolean) as Item[]);
      setLoading(false);
    })();
  }, [user, authLoading]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-slate-100">
      <Helmet>
        <title>My wishlist — CarnageMC</title>
        <meta name="description" content="Store items you've saved for later." />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full font-['Inter']">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
          <Link
            to="/me/status"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#9ca3af] hover:text-[#ff5722] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> My account
          </Link>

          <div className="border-b border-white/5 pb-6">
            <span className="text-[#ff5722] font-mono text-xs tracking-widest uppercase">
              Marketplace
            </span>
            <h1 className="text-5xl font-bold font-['Space_Grotesk'] tracking-tighter italic flex items-center gap-3">
              <Heart className="w-10 h-10 text-[#ff5722]" fill="currentColor" strokeWidth={1.5} />
              WISHLIST
            </h1>
          </div>

          {!user && !authLoading ? (
            <p className="text-[#9ca3af]">
              <Link to="/auth" className="text-[#ff5722] hover:underline">Sign in</Link> to
              view your wishlist.
            </p>
          ) : loading ? (
            <p className="text-[#9ca3af]">Loading…</p>
          ) : items.length === 0 ? (
            <div className="border border-white/10 bg-[#12121a] p-10 text-center space-y-3">
              <Package className="w-10 h-10 mx-auto text-[#ff5722]/40" strokeWidth={1.25} />
              <h2 className="text-2xl font-bold font-['Space_Grotesk']">Nothing saved yet</h2>
              <p className="text-[#9ca3af]">
                Tap the heart on any package to save it here.
              </p>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff5722] text-white text-xs font-mono uppercase tracking-widest hover:bg-[#ff5722]/90 transition"
              >
                Browse the store
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="relative p-5 bg-[#1a1a24] border border-white/5 hover:border-[#ff5722]/40 transition group flex flex-col"
                >
                  <div className="absolute top-3 right-3 z-10">
                    <WishlistButton itemId={it.id} />
                  </div>
                  <Link to={`/store/package/${it.id}`} className="block flex-1">
                    <h3 className="font-bold font-['Space_Grotesk'] group-hover:text-[#ff5722] transition-colors pr-8">
                      {it.name}
                    </h3>
                    {it.description && (
                      <p className="text-sm text-[#9ca3af] mt-1 line-clamp-2">
                        {it.description}
                      </p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/5 font-bold font-['Space_Grotesk']">
                      {formatPrice(it.price, it.currency)}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      cart.add({
                        id: it.id,
                        name: it.name,
                        price: it.price,
                        currency: it.currency,
                        image_url: it.image_url,
                        external_url: null,
                      });
                      toast.success(`${it.name} added to cart`);
                    }}
                    className="mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-mono tracking-widest uppercase border border-white/10 hover:border-[#ff5722] hover:text-[#ff5722] transition"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Add to cart
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
