import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { useCart, formatMoney } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Zap,
  Package,
  Coins,
  Award,
  Flame,
  Star,
  ExternalLink,
  Plus,
  Minus,
  Trash2,
  Check,
} from "lucide-react";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
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

const ICONS: Record<string, any> = {
  Sparkles,
  Zap,
  Package,
  Coins,
  Award,
  Flame,
  Star,
  ShoppingBag,
};

const iconFor = (name?: string | null) => ICONS[name ?? ""] ?? Package;

const formatPrice = (p: number | null | undefined, c?: string | null) => {
  if (p == null) return "";
  const cur = (c || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(Number(p));
  } catch {
    return `${cur} ${Number(p).toFixed(2)}`;
  }
};

export default function Store() {
  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState<string>("all");
  const cart = useCart();
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("store_categories")
      .select("id, slug, name, description, icon, sort_order")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setCats((data as Category[]) ?? []));
    supabase
      .from("store_items")
      .select(
        "id, category_id, name, description, price, currency, image_url, badge, featured, external_url, sort_order",
      )
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setItems((data as Item[]) ?? []));
  }, []);

  // Scroll to #cart when hash is present (also after items load so section exists).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollToCart = () => {
      if (window.location.hash !== "#cart") return;
      const el = document.getElementById("cart");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    scrollToCart();
    const t = window.setTimeout(scrollToCart, 250);
    window.addEventListener("hashchange", scrollToCart);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", scrollToCart);
    };
  }, [items]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (activeCat !== "all" && it.category_id !== activeCat) return false;
      if (!needle) return true;
      return (
        it.name.toLowerCase().includes(needle) ||
        (it.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [items, q, activeCat]);

  const featured = filtered.filter((i) => i.featured);
  const rest = filtered.filter((i) => !i.featured);
  const heroItem = featured[0] ?? rest[0];
  const sideFeatured = (heroItem ? featured.filter((i) => i.id !== heroItem.id) : featured).slice(
    0,
    2,
  );

  const restByCat = useMemo(() => {
    const g: Record<string, Item[]> = {};
    for (const it of rest) {
      if (heroItem && it.id === heroItem.id) continue;
      (g[it.category_id] ||= []).push(it);
    }
    return g;
  }, [rest, heroItem]);

  const catName = (id: string) => cats.find((c) => c.id === id)?.name ?? "More";

  const ItemLink = ({
    it,
    children,
    className,
  }: {
    it: Item;
    children: React.ReactNode;
    className?: string;
  }) =>
    it.external_url ? (
      <a
        href={it.external_url}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        {children}
      </a>
    ) : (
      <div className={className}>{children}</div>
    );

  const handleAdd = (it: Item) => {
    cart.add({
      id: it.id,
      name: it.name,
      price: it.price,
      currency: it.currency,
      image_url: it.image_url,
      external_url: it.external_url,
    });
    setJustAdded(it.id);
    window.setTimeout(() => {
      setJustAdded((cur) => (cur === it.id ? null : cur));
    }, 1400);
  };

  const AddToCartButton = ({
    it,
    size = "sm",
  }: {
    it: Item;
    size?: "sm" | "lg";
  }) => {
    const added = justAdded === it.id;
    const base =
      size === "lg"
        ? "px-5 py-2.5 text-xs"
        : "px-3 py-1.5 text-[11px]";
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAdd(it);
        }}
        className={`${base} font-mono tracking-widest uppercase inline-flex items-center gap-2 border transition ${
          added
            ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300"
            : "bg-[#ff5722] border-[#ff5722] text-white hover:bg-[#ff5722]/90"
        }`}
        aria-label={`Add ${it.name} to cart`}
      >
        {added ? (
          <>
            <Check className="w-3.5 h-3.5" /> Added
          </>
        ) : (
          <>
            <ShoppingCart className="w-3.5 h-3.5" /> Add
          </>
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-slate-100">
      <Helmet>
        <title>Store — CarnageMC</title>
        <meta
          name="description"
          content="CarnageMC store: ranks, cosmetics, boosters, bundles, and in-game coins."
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full font-['Inter']">
        <div className="max-w-6xl w-full mx-auto px-4 md:px-8 py-10 md:py-14 flex flex-col gap-12">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
            <div className="space-y-2">
              <span className="text-[#ff5722] font-mono text-sm tracking-widest uppercase">
                Marketplace
              </span>
              <h1 className="text-6xl md:text-8xl font-bold font-['Space_Grotesk'] tracking-tighter italic">
                STORE
              </h1>
            </div>
            <div className="relative group max-w-md w-full">
              <div className="absolute -inset-0.5 bg-[#ff5722] opacity-20 blur-sm group-focus-within:opacity-40 transition pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search the store..."
                className="relative w-full bg-[#1a1a24] border border-white/10 px-6 py-4 rounded-none focus:outline-none focus:border-[#ff5722] text-lg font-['Space_Grotesk'] tracking-wide text-slate-100 placeholder:text-[#5f6472]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ff5722] font-mono text-xs opacity-50 hidden sm:block">
                [/]
              </div>
            </div>
          </div>

          {/* Category tabs */}
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-2 -mt-4">
              <button
                onClick={() => setActiveCat("all")}
                className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border transition ${
                  activeCat === "all"
                    ? "bg-[#ff5722] border-[#ff5722] text-white"
                    : "border-white/10 text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722]"
                }`}
              >
                All
              </button>
              {cats.map((c) => {
                const Icon = iconFor(c.icon);
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`px-4 py-2 text-xs font-mono tracking-widest uppercase border transition inline-flex items-center gap-2 ${
                      activeCat === c.id
                        ? "bg-[#ff5722] border-[#ff5722] text-white"
                        : "border-white/10 text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-[#9ca3af]">
              {items.length === 0 ? "The store is empty." : "No items match your search."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Featured hero */}
              {heroItem && (
                <ItemLink
                  it={heroItem}
                  className="md:col-span-8 group relative bg-[#1a1a24] overflow-hidden min-h-[320px] md:min-h-[380px] flex flex-col justify-end p-8 border border-white/5 hover:border-[#ff5722]/40 transition-colors"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10" />
                  {heroItem.image_url ? (
                    <img
                      src={heroItem.image_url}
                      alt={heroItem.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 opacity-30 z-0"
                      style={{
                        background:
                          "radial-gradient(circle at 20% 30%, rgba(255,87,34,0.35), transparent 55%)",
                      }}
                    />
                  )}
                  <div className="absolute top-0 right-0 p-4 z-20">
                    <span className="bg-[#ff5722] text-white text-[10px] font-bold px-2 py-1 tracking-widest uppercase">
                      {heroItem.badge || catName(heroItem.category_id)}
                    </span>
                  </div>
                  <div className="relative z-20 space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold font-['Space_Grotesk'] leading-none group-hover:text-[#ff5722] transition-colors">
                      {heroItem.name}
                    </h2>
                    {heroItem.description && (
                      <p className="text-[#9ca3af] max-w-md line-clamp-2">
                        {heroItem.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#ff5722] uppercase tracking-widest">
                      <span className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] not-italic normal-case tracking-normal text-white">
                        {formatPrice(heroItem.price, heroItem.currency)}
                      </span>
                      <AddToCartButton it={heroItem} size="lg" />
                      {heroItem.external_url && (
                        <span className="inline-flex items-center gap-1">
                          Get it <ExternalLink className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </ItemLink>
              )}

              {/* Side featured */}
              {sideFeatured.length > 0 && (
                <div className="md:col-span-4 flex flex-col gap-6">
                  {sideFeatured.map((it, i) => (
                    <ItemLink
                      key={it.id}
                      it={it}
                      className={`bg-[#1a1a24] p-6 border-l-4 flex flex-col justify-between min-h-[180px] hover:bg-[#23232f] transition-all group ${
                        i === 0
                          ? "border-[#ff5722]"
                          : "border-white/10 hover:border-[#ff5722]"
                      }`}
                    >
                      <div>
                        <h3 className="text-xl font-bold font-['Space_Grotesk'] group-hover:text-[#ff5722] transition-colors">
                          {it.name}
                        </h3>
                        {it.description && (
                          <p className="text-[#9ca3af] text-sm mt-2 line-clamp-2">
                            {it.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4 gap-3">
                        <span className="text-lg font-bold font-['Space_Grotesk']">
                          {formatPrice(it.price, it.currency)}
                        </span>
                        <AddToCartButton it={it} />
                      </div>
                    </ItemLink>
                  ))}
                </div>
              )}

              {/* Sections by category */}
              {Object.entries(restByCat).map(([catId, arr]) => {
                const cat = cats.find((c) => c.id === catId);
                const Icon = iconFor(cat?.icon);
                return (
                  <div key={catId} className="md:col-span-12 mt-4">
                    <div className="flex items-center gap-4 mb-6">
                      <Icon className="w-4 h-4 text-[#ff5722]" strokeWidth={1.5} />
                      <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em]">
                        {catName(catId)}
                      </h2>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {arr.map((it) => (
                        <ItemLink
                          key={it.id}
                          it={it}
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
                              <p className="text-sm text-[#9ca3af] mt-1 line-clamp-2">
                                {it.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 gap-3">
                            <span className="font-bold font-['Space_Grotesk']">
                              {formatPrice(it.price, it.currency)}
                            </span>
                            <AddToCartButton it={it} />
                          </div>
                        </ItemLink>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Cart summary */}
              <section
                id="cart"
                className="md:col-span-12 mt-8 scroll-mt-24 bg-[#12121a] border border-white/10"
              >
                <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
                  <ShoppingCart className="w-4 h-4 text-[#ff5722]" strokeWidth={1.75} />
                  <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em]">
                    Your Cart
                  </h2>
                  <span className="text-xs font-mono text-[#9ca3af] tracking-widest">
                    {cart.count} {cart.count === 1 ? "ITEM" : "ITEMS"}
                  </span>
                  <div className="flex-1 h-px bg-white/5" />
                  {cart.items.length > 0 && (
                    <button
                      onClick={() => cart.clear()}
                      className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af] hover:text-[#ff5722] transition inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>

                {cart.items.length === 0 ? (
                  <div className="px-6 py-10 text-center text-[#9ca3af] font-mono text-xs tracking-widest uppercase">
                    Your cart is empty — pick something above.
                  </div>
                ) : (
                  <>
                    <ul className="divide-y divide-white/5">
                      {cart.items.map((ci) => (
                        <li
                          key={ci.id}
                          className="flex items-center gap-4 px-6 py-4"
                        >
                          <div className="w-12 h-12 shrink-0 bg-[#1a1a24] border border-white/5 overflow-hidden flex items-center justify-center">
                            {ci.image_url ? (
                              <img
                                src={ci.image_url}
                                alt={ci.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-[#ff5722]" strokeWidth={1.5} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold font-['Space_Grotesk'] truncate">
                              {ci.name}
                            </div>
                            <div className="text-xs text-[#9ca3af] font-mono">
                              {formatPrice(ci.price, ci.currency)} each
                            </div>
                          </div>
                          <div className="inline-flex items-center border border-white/10">
                            <button
                              type="button"
                              aria-label={`Decrease ${ci.name}`}
                              onClick={() => cart.setQty(ci.id, ci.quantity - 1)}
                              className="w-8 h-8 grid place-items-center text-[#9ca3af] hover:text-[#ff5722] hover:bg-white/5"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-10 text-center font-mono text-sm tabular-nums">
                              {ci.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${ci.name}`}
                              onClick={() => cart.setQty(ci.id, ci.quantity + 1)}
                              className="w-8 h-8 grid place-items-center text-[#9ca3af] hover:text-[#ff5722] hover:bg-white/5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="w-24 text-right font-bold font-['Space_Grotesk'] tabular-nums">
                            {formatMoney(
                              (Number(ci.price) || 0) * ci.quantity,
                              (ci.currency || "USD").toUpperCase(),
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label={`Remove ${ci.name}`}
                            onClick={() => cart.remove(ci.id)}
                            className="text-[#9ca3af] hover:text-[#ff5722] transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-5 border-t border-white/5 bg-[#0f0f16]">
                      <div className="flex items-baseline gap-3">
                        <span className="text-xs font-mono uppercase tracking-widest text-[#9ca3af]">
                          Subtotal
                        </span>
                        <span className="text-2xl font-bold font-['Space_Grotesk'] tabular-nums">
                          {formatMoney(cart.subtotal, cart.currency)}
                        </span>
                      </div>
                      <Link
                        to="/support"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#ff5722] hover:bg-[#ff5722]/90 text-white text-xs font-mono tracking-widest uppercase transition"
                      >
                        Checkout <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                )}
              </section>


              {/* Footer strip */}
              <div className="md:col-span-12 flex flex-col md:flex-row gap-4 items-center justify-between mt-6 pt-6 border-t border-white/5">
                <div className="flex flex-wrap gap-6 md:gap-8">
                  <Link
                    to="/support"
                    className="text-xs font-mono text-[#9ca3af] hover:text-[#ff5722] tracking-widest transition"
                  >
                    SUPPORT
                  </Link>
                  <Link
                    to="/wiki"
                    className="text-xs font-mono text-[#9ca3af] hover:text-[#ff5722] tracking-widest transition"
                  >
                    WIKI
                  </Link>
                  <Link
                    to="/changelog"
                    className="text-xs font-mono text-[#9ca3af] hover:text-[#ff5722] tracking-widest transition"
                  >
                    CHANGELOG
                  </Link>
                  <a
                    href="#cart"
                    className="text-xs font-mono text-[#9ca3af] hover:text-[#ff5722] tracking-widest transition"
                  >
                    CART ({cart.count})
                  </a>
                  <Link
                    to="/wiki/ranks-carnage"
                    className="text-xs font-mono text-[#ff5722] hover:text-white tracking-widest transition"
                  >
                    RANK PERKS
                  </Link>
                </div>
                <div className="text-[10px] text-white/20 font-mono flex items-center gap-2">
                  <ShoppingBag className="w-3 h-3" /> CARNAGEMC MARKETPLACE
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
