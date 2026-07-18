import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import StickyCartBar from "@/components/site/StickyCartBar";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import {
  Sparkles, Zap, Package, Coins, Award, Flame, Star, ShoppingBag,
  ArrowLeft, Check, Plus, ChevronLeft, ChevronRight,
} from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
};

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
};

const ICONS: Record<string, any> = { Sparkles, Zap, Package, Coins, Award, Flame, Star, ShoppingBag };
const iconFor = (name?: string | null) => ICONS[name ?? ""] ?? Package;

const PAGE_SIZE = 12;

const formatPrice = (p: number | null | undefined, c?: string | null) => {
  if (p == null) return "";
  const cur = (c || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(Number(p));
  } catch {
    return `${cur} ${Number(p).toFixed(2)}`;
  }
};

const RANK_SLUGS = new Set(["ranks", "rank-upgrades"]);

export default function StoreCategory() {
  const { slug = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const [cat, setCat] = useState<Category | null>(null);
  const [featured, setFeatured] = useState<Item[]>([]);
  const [pageItems, setPageItems] = useState<Item[]>([]);
  const [totalRest, setTotalRest] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const cart = useCart();

  const totalPages = Math.max(1, Math.ceil(totalRest / PAGE_SIZE));
  const page = Math.min(pageParam, totalPages);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const { data: c } = await supabase
        .from("store_categories")
        .select("id, slug, name, description, icon")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (cancelled) return;
      if (!c) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setCat(c as Category);

      // Featured items (always shown on every page)
      const { data: feat } = await supabase
        .from("store_items")
        .select("id, category_id, name, description, price, currency, image_url, badge, featured, external_url, sort_order")
        .eq("category_id", (c as Category).id)
        .eq("published", true)
        .eq("featured", true)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });
      if (cancelled) return;
      setFeatured((feat as Item[]) ?? []);

      // Paginated non-featured items with stable sort
      const from = (pageParam - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data: its, count } = await supabase
        .from("store_items")
        .select(
          "id, category_id, name, description, price, currency, image_url, badge, featured, external_url, sort_order",
          { count: "exact" },
        )
        .eq("category_id", (c as Category).id)
        .eq("published", true)
        .eq("featured", false)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to);
      if (cancelled) return;
      setPageItems((its as Item[]) ?? []);
      setTotalRest(count ?? 0);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug, pageParam]);

  const isRank = RANK_SLUGS.has(cat?.slug ?? "");

  const goToPage = (n: number) => {
    const next = new URLSearchParams(searchParams);
    if (n <= 1) next.delete("page");
    else next.set("page", String(n));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAdd = (it: Item) => {
    cart.add({
      id: it.id,
      name: it.name,
      price: it.price,
      currency: it.currency,
      image_url: it.image_url,
      external_url: it.external_url,
      maxQuantity: isRank ? 1 : undefined,
    });
    setJustAdded(it.id);
    toast.success(`Added ${it.name} to cart`);
    window.setTimeout(() => {
      setJustAdded((cur) => (cur === it.id ? null : cur));
    }, 1400);
  };

  const AddBtn = ({ it }: { it: Item }) => {
    const added = justAdded === it.id;
    return (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAdd(it); }}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-widest uppercase border transition ${
          added
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-[#ff5722] text-[#ff5722] hover:bg-[#ff5722] hover:text-white"
        }`}
      >
        {added ? <><Check className="w-3 h-3" /> Added</> : <><Plus className="w-3 h-3" /> Add</>}
      </button>
    );
  };

  const Icon = iconFor(cat?.icon);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Helmet>
        <title>{cat ? `${cat.name} — Store` : "Category — Store"}</title>
        <meta
          name="description"
          content={cat?.description ?? `Browse ${cat?.name ?? "store"} items on CarnageMC.`}
        />
        <link rel="canonical" href={`${window.location.origin}/store/category/${slug}`} />
      </Helmet>
      <Navbar />
      <main className="container mx-auto px-4 md:px-6 py-10 max-w-6xl">
        <Link
          to="/store"
          className="inline-flex items-center gap-2 text-xs font-mono tracking-widest uppercase text-[#9ca3af] hover:text-[#ff5722] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to store
        </Link>

        {loading ? (
          <p className="text-[#9ca3af] mt-10">Loading…</p>
        ) : notFound ? (
          <div className="mt-10">
            <h1 className="text-3xl font-bold font-['Space_Grotesk']">Category not found</h1>
            <p className="text-[#9ca3af] mt-2">
              We couldn't find a store category with that name.
            </p>
          </div>
        ) : (
          <>
            <header className="mt-6 mb-10">
              <div className="flex items-center gap-3 text-[#ff5722]">
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-xs font-mono uppercase tracking-[0.3em]">Category</span>
              </div>
              <h1 className="mt-3 text-4xl md:text-5xl font-bold font-['Space_Grotesk']">
                {cat!.name}
              </h1>
              {cat!.description && (
                <p className="text-[#9ca3af] mt-3 max-w-2xl">{cat!.description}</p>
              )}
            </header>

            {featured.length === 0 && pageItems.length === 0 ? (
              <p className="text-[#9ca3af]">No items in this category yet.</p>
            ) : (
              <div className="space-y-10">
                {featured.length > 0 && (
                  <section>
                    <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em] mb-4">
                      Featured
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {featured.map((it) => (
                        <Link
                          key={it.id}
                          to={`/store/package/${it.id}`}
                          className="relative bg-[#1a1a24] border border-white/5 hover:border-[#ff5722]/40 transition p-6 min-h-[200px] flex flex-col justify-between overflow-hidden group"
                        >
                          {it.image_url && (
                            <img
                              src={it.image_url}
                              alt={it.name}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover opacity-25"
                            />
                          )}
                          <div className="relative z-10">
                            <h3 className="text-2xl font-bold font-['Space_Grotesk'] group-hover:text-[#ff5722] transition-colors">
                              {it.name}
                            </h3>
                            {it.description && (
                              <p className="text-[#9ca3af] text-sm mt-2 line-clamp-2">{it.description}</p>
                            )}
                          </div>
                          <div className="relative z-10 flex items-center justify-between mt-4 gap-3">
                            <span className="text-lg font-bold font-['Space_Grotesk']">
                              {formatPrice(it.price, it.currency)}
                            </span>
                            <AddBtn it={it} />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {pageItems.length > 0 && (
                  <section>
                    {featured.length > 0 && (
                      <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em] mb-4">
                        All items
                      </h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pageItems.map((it) => (
                        <Link
                          key={it.id}
                          to={`/store/package/${it.id}`}
                          className="p-6 bg-[#1a1a24] border border-white/5 hover:border-[#ff5722]/30 transition group flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold font-['Space_Grotesk'] group-hover:text-[#ff5722] transition-colors">
                                {it.name}
                              </h4>
                              {it.badge && (
                                <span className="text-[9px] font-mono tracking-widest uppercase bg-[#ff5722]/10 text-[#ff5722] px-1.5 py-0.5 border border-[#ff5722]/30">
                                  {it.badge}
                                </span>
                              )}
                            </div>
                            {it.description && (
                              <p className="text-sm text-[#9ca3af] mt-1 line-clamp-2">{it.description}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 gap-3">
                            <span className="font-bold font-['Space_Grotesk']">
                              {formatPrice(it.price, it.currency)}
                            </span>
                            <AddBtn it={it} />
                          </div>
                        </Link>
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <nav
                        aria-label="Pagination"
                        className="flex items-center justify-between mt-8 gap-4"
                      >
                        <button
                          onClick={() => goToPage(page - 1)}
                          disabled={page <= 1}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-widest uppercase border border-white/10 text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-[#9ca3af]"
                        >
                          <ChevronLeft className="w-3 h-3" /> Prev
                        </button>
                        <span className="text-xs font-mono tracking-widest uppercase text-[#9ca3af]">
                          Page {page} of {totalPages}
                        </span>
                        <button
                          onClick={() => goToPage(page + 1)}
                          disabled={page >= totalPages}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono tracking-widest uppercase border border-white/10 text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722] transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:text-[#9ca3af]"
                        >
                          Next <ChevronRight className="w-3 h-3" />
                        </button>
                      </nav>
                    )}
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <StickyCartBar />
    </div>
  );
}
