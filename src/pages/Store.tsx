import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useCart, formatMoney } from "@/lib/cart";
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
                    <div className="flex items-center gap-4 text-xs font-mono text-[#ff5722] uppercase tracking-widest">
                      <span className="text-2xl md:text-3xl font-bold font-['Space_Grotesk'] not-italic normal-case tracking-normal text-white">
                        {formatPrice(heroItem.price, heroItem.currency)}
                      </span>
                      <div className="h-px w-12 bg-[#ff5722] group-hover:w-20 transition-all" />
                      <span className="inline-flex items-center gap-1">
                        Get it <ExternalLink className="w-3 h-3" />
                      </span>
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
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-lg font-bold font-['Space_Grotesk']">
                          {formatPrice(it.price, it.currency)}
                        </span>
                        <span className="text-xs font-mono text-[#ff5722] tracking-widest">
                          {it.badge || catName(it.category_id).toUpperCase()}
                        </span>
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
                          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                            <span className="font-bold font-['Space_Grotesk']">
                              {formatPrice(it.price, it.currency)}
                            </span>
                            {it.external_url && (
                              <span className="text-xs font-mono text-[#ff5722] tracking-widest inline-flex items-center gap-1">
                                BUY <ExternalLink className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </ItemLink>
                      ))}
                    </div>
                  </div>
                );
              })}

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
