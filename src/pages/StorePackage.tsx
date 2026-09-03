import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import StickyCartBar from "@/components/site/StickyCartBar";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Package,
  Share2,
  ShoppingCart,
} from "lucide-react";

import { WishlistButton } from "@/components/site/WishlistButton";
import { StorePackageReviews } from "@/components/site/StorePackageReviews";
import { recordRecentlyViewed } from "@/lib/recentlyViewed";

type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  badge: string | null;
  featured: boolean;
  external_url: string | null;
  sort_order: number;
  published: boolean;
};

type Category = { id: string; slug: string; name: string };

const formatPrice = (p: number | null | undefined, c?: string | null) => {
  if (p == null) return "";
  const cur = (c || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(Number(p));
  } catch {
    return `${cur} ${Number(p).toFixed(2)}`;
  }
};

export default function StorePackage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const cart = useCart();
  const [item, setItem] = useState<Item | null>(null);
  const [cat, setCat] = useState<Category | null>(null);
  const [related, setRelated] = useState<Item[]>([]);
  const [alsoLike, setAlsoLike] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from("store_items")
        .select("*")
        .eq("id", id)
        .eq("published", true)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setItem(data as Item);
      recordRecentlyViewed((data as Item).id);
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase
          .from("store_categories")
          .select("id, slug, name")
          .eq("id", (data as Item).category_id)
          .maybeSingle(),
        supabase
          .from("store_items")
          .select("*")
          .eq("category_id", (data as Item).category_id)
          .eq("published", true)
          .neq("id", id)
          .order("sort_order")
          .limit(6),
      ]);
      if (cancelled) return;
      setCat((c as Category) ?? null);
      setRelated((r as Item[]) ?? []);
      // Cross-category "you might also like" from popular items
      const { data: pop } = await supabase.rpc("get_popular_store_items", { _limit: 12 });
      if (!cancelled && Array.isArray(pop) && pop.length > 0) {
        const ids = pop.map((p: any) => p.item_id).filter(Boolean);
        const { data: popItems } = await supabase
          .from("store_items")
          .select("*")
          .in("id", ids)
          .eq("published", true)
          .neq("category_id", (data as Item).category_id);
        if (!cancelled && Array.isArray(popItems)) {
          const byId = new Map((popItems as Item[]).map((i) => [i.id, i]));
          const ordered = ids
            .map((pid: string) => byId.get(pid))
            .filter(Boolean)
            .slice(0, 4) as Item[];
          setAlsoLike(ordered);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const lineTotal = useMemo(
    () => (Number(item?.price) || 0) * qty,
    [item, qty],
  );

  const isRankLike =
    cat?.slug === "ranks" || cat?.slug === "rank-upgrades";

  const handleAdd = () => {
    if (!item) return;
    cart.add(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        currency: item.currency,
        image_url: item.image_url,
        external_url: item.external_url,
        maxQuantity: isRankLike ? 1 : undefined,
      },
      isRankLike ? 1 : qty,
    );
    setJustAdded(true);
    toast.success(`${item.name} added to cart`);
    window.setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 bg-grid opacity-[0.35]" />
        <div className="absolute inset-x-0 top-0 h-72 opacity-[0.12]" style={{ background: "var(--gradient-fire)" }} />
      </div>
      <Helmet>
        <title>{item ? `${item.name} — Store` : "Store"} | Warden Network</title>
        <meta
          name="description"
          content={item?.description ?? "Warden Network store package details."}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full font-['Inter']">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to store
          </Link>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : notFound || !item ? (
            <div className="border border-white/10 bg-card p-10 text-center space-y-3">
              <h1 className="text-3xl font-bold font-['Space_Grotesk']">Package not found</h1>
              <p className="text-muted-foreground">This package is unavailable or unpublished.</p>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-mono uppercase tracking-widest hover:bg-primary/90 transition"
              >
                Browse the store
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Image */}
                <div className="md:col-span-2">
                  <div className="relative aspect-square bg-muted border border-white/5 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center">
                        <Package className="w-16 h-16 text-primary/40" strokeWidth={1.25} />
                      </div>
                    )}
                    {item.badge && (
                      <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 tracking-widest uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="md:col-span-3 space-y-5">
                  {cat && (
                    <Link
                      to={`/store?cat=${cat.slug}`}
                      className="text-[10px] font-mono uppercase tracking-widest text-primary hover:underline"
                    >
                      {cat.name}
                    </Link>
                  )}
                  <h1 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] leading-none">
                    {item.name}
                  </h1>
                  <div className="text-3xl font-bold font-['Space_Grotesk']">
                    {formatPrice(item.price, item.currency)}
                  </div>
                  {item.description && (
                    <p className="text-[#cbd5e1] whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Quantity + Add */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <div className="inline-flex items-center border border-white/10">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="w-9 h-10 grid place-items-center text-muted-foreground hover:text-primary hover:bg-white/5"
                      >
                        −
                      </button>
                      <span className="w-12 text-center font-mono tabular-nums">{qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQty((q) => Math.min(99, q + 1))}
                        className="w-9 h-10 grid place-items-center text-muted-foreground hover:text-primary hover:bg-white/5"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdd}
                      className={`inline-flex items-center gap-2 px-6 py-3 text-xs font-mono tracking-widest uppercase border transition ${
                        justAdded
                          ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300"
                          : "bg-primary border-primary text-primary-foreground hover:bg-primary/90"
                      }`}
                    >
                      {justAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Added
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" /> Add to cart —{" "}
                          {formatPrice(lineTotal, item.currency)}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleAdd();
                        cart.openCart();
                      }}
                      className="inline-flex items-center gap-2 px-6 py-3 text-xs font-mono tracking-widest uppercase border border-white/10 hover:border-primary hover:text-primary transition"
                    >
                      Buy now
                    </button>
                    <div className="inline-flex items-center border border-white/10 px-3 h-[46px]">
                      <WishlistButton itemId={item.id} />
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const url = `${window.location.origin}/store/package/${item.id}`;
                        const shareData = {
                          title: item.name,
                          text: `Check out ${item.name} on the store`,
                          url,
                        };
                        try {
                          if (navigator.share) {
                            await navigator.share(shareData);
                            return;
                          }
                        } catch {
                          // fall through to clipboard
                        }
                        try {
                          await navigator.clipboard.writeText(url);
                          toast.success("Link copied to clipboard");
                        } catch {
                          toast.error("Couldn't copy link");
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 h-[46px] text-xs font-mono tracking-widest uppercase border border-white/10 hover:border-primary hover:text-primary transition"
                      aria-label="Share package"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  </div>

              </div>

              {/* Reviews */}
              <StorePackageReviews itemId={item.id} />
              </div>

              {/* Related */}
              {related.length > 0 && (
                <section className="pt-10 border-t border-white/5">
                  <h2 className="text-sm font-mono text-primary uppercase tracking-[0.3em] mb-6">
                    More in {cat?.name ?? "this category"}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        to={`/store/package/${r.id}`}
                        className="p-5 bg-muted border border-white/5 hover:border-primary/40 transition group flex flex-col justify-between"
                      >
                        <div>
                          <h3 className="font-bold font-['Space_Grotesk'] group-hover:text-primary transition-colors">
                            {r.name}
                          </h3>
                          {r.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {r.description}
                            </p>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5 font-bold font-['Space_Grotesk']">
                          {formatPrice(r.price, r.currency)}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* You might also like — cross-category popular */}
              {alsoLike.length > 0 && (
                <section className="pt-10 border-t border-white/5">
                  <h2 className="text-sm font-mono text-primary uppercase tracking-[0.3em] mb-6">
                    You might also like
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {alsoLike.map((r) => (
                      <Link
                        key={r.id}
                        to={`/store/package/${r.id}`}
                        className="group block bg-background border border-white/5 hover:border-primary/40 transition overflow-hidden"
                      >
                        <div className="aspect-square bg-muted relative overflow-hidden">
                          {r.image_url ? (
                            <img
                              src={r.image_url}
                              alt={r.name}
                              loading="lazy"
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-primary/30">
                              <Package className="w-8 h-8" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5">
                          <div className="text-xs font-semibold truncate group-hover:text-primary transition">
                            {r.name}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {formatPrice(r.price, r.currency)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <StickyCartBar />
    </div>
  );
}
