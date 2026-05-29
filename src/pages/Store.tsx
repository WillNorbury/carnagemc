import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Package, Sparkles, ExternalLink, ShoppingBag, MessageCircle, Receipt, ArrowRight,
  Crown, Flame, TimerReset, Users, Star, Shield, Gem, KeyRound, Gift, TrendingUp, Zap,
} from "lucide-react";

type Category = { id: string; slug: string; name: string; description: string; sort_order: number };
type Item = {
  id: string;
  category_id: string | null;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string | null;
  badge: string | null;
  featured: boolean;
  external_url: string | null;
  sort_order: number;
};

const formatPrice = (price: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
};

const categoryIcons: Record<string, typeof Package> = {
  ranks: Crown,
  rank: Crown,
  crates: Gift,
  crate: Gift,
  keys: KeyRound,
  key: KeyRound,
  bundles: Gem,
  bundle: Gem,
  featured: Star,
  cosmetics: Sparkles,
  perks: Shield,
};

const useCountdown = (target: Date) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
};

const Store = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Store — XyloMC";
    (async () => {
      const [{ data: cats }, { data: its }] = await Promise.all([
        supabase.from("store_categories").select("id,slug,name,description,sort_order").eq("published", true).order("sort_order"),
        supabase.from("store_items").select("*").eq("published", true).order("sort_order"),
      ]);
      setCategories((cats ?? []) as Category[]);
      setItems((its ?? []) as Item[]);
      setLoading(false);
    })();
  }, []);

  const featured = useMemo(() => items.filter((i) => i.featured), [items]);
  const itemsByCat = useMemo(() => {
    const map: Record<string, Item[]> = { uncategorized: [] };
    for (const c of categories) map[c.id] = [];
    for (const it of items) {
      const key = it.category_id && map[it.category_id] ? it.category_id : "uncategorized";
      map[key].push(it);
    }
    return map;
  }, [items, categories]);

  const tabs = useMemo(() => {
    const list = [{ id: "all", name: "All" }, ...categories.map((c) => ({ id: c.id, name: c.name }))];
    if (itemsByCat.uncategorized?.length) list.push({ id: "uncategorized", name: "Other" });
    return list;
  }, [categories, itemsByCat]);

  // Sale countdown — ends 3 days from page load
  const saleEnd = useMemo(() => new Date(Date.now() + 1000 * 60 * 60 * 24 * 3 + 1000 * 60 * 60 * 14 + 1000 * 60 * 28), []);
  const { d, h, m, s } = useCountdown(saleEnd);

  const announcements = [
    { tag: "NEW", color: "from-primary to-accent", title: "Cosmic Crates", desc: "Brand new animated crate rewards are now available.", cta: "View Crates" },
    { tag: "LIMITED", color: "from-fuchsia-500 to-rose-500", title: "Summer Bundles", desc: "Exclusive seasonal bundles available for a limited time.", cta: "Browse" },
    { tag: "HOT", color: "from-amber-500 to-red-500", title: "Lifesteal Pass", desc: "Unlock exclusive Lifesteal missions and cosmetics.", cta: "Unlock" },
  ];

  const stats = [
    { label: "Players Online", value: "1,284", icon: Users, accent: "text-emerald-400" },
    { label: "Server Status", value: "ONLINE", icon: Zap, accent: "text-emerald-400" },
    { label: "Discord Members", value: "8.4K", icon: MessageCircle, accent: "text-indigo-400" },
    { label: "Store Sales", value: "$12K", icon: TrendingUp, accent: "text-primary" },
  ];

  const ItemCard = ({ it }: { it: Item }) => (
    <Card className="overflow-hidden group hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.4)] flex flex-col">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {it.image_url ? (
          <img
            src={it.image_url}
            alt={it.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        {/* shine */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {it.badge && (
          <Badge className="absolute top-2 left-2 shadow-md">{it.badge}</Badge>
        )}
        {it.featured && (
          <Badge variant="secondary" className="absolute top-2 right-2 border-primary/40 text-primary">
            <Sparkles className="h-3 w-3 mr-1" /> Featured
          </Badge>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="font-display font-bold text-lg leading-tight">{it.name}</h3>
        {it.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{it.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-display text-xl font-black text-gradient">
            {formatPrice(it.price, it.currency)}
          </span>
          {it.external_url ? (
            <Button asChild size="sm">
              <a href={it.external_url} target="_blank" rel="noopener noreferrer">
                Buy <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="secondary" disabled>Soon</Button>
          )}
        </div>
      </div>
    </Card>
  );

  const recentPayments = useMemo(() => {
    const names = ["Rosie", "Steve_99", "AlexCraft", "NotchFan", "EnderQueen", "DiamondMike", "PixelKnight", "ShadowWolf"];
    const pool = items.length ? items : [];
    return Array.from({ length: 6 }).map((_, i) => {
      const it = pool[i % Math.max(pool.length, 1)];
      return {
        id: i,
        user: names[i % names.length],
        item: it?.name ?? "Mystery Crate",
        price: it ? formatPrice(it.price, it.currency) : "$4.99",
        ago: `${i * 3 + 2}m ago`,
      };
    });
  }, [items]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Sale Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[shimmer_6s_linear_infinite]">
        <div className="container py-2.5 flex flex-wrap items-center justify-center gap-3 text-primary-foreground text-sm font-semibold">
          <Badge className="bg-background/20 text-primary-foreground border-0 backdrop-blur">
            <Flame className="h-3 w-3 mr-1" /> 50% OFF SALE
          </Badge>
          <span>Summer Sale Ending Soon — Use code <span className="font-black tracking-wider">XYLO50</span></span>
          <a href="#packages" className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
            Shop Now <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      <main className="flex-1 relative">
        {/* Hero */}
        <section className="relative overflow-hidden border-b">
          <Particles count={32} />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="container relative py-20 md:py-28 text-center">
            <Badge variant="secondary" className="mb-5 border-primary/40 text-primary">
              <Sparkles className="h-3 w-3 mr-1" /> Premium Perks
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-5">
              Level Up Your <span className="text-gradient">Experience</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg mb-6">
              Support the server and unlock exclusive ranks, cosmetics, and crate keys.
            </p>

            {/* Countdown */}
            <div className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full border border-primary/30 bg-card/60 backdrop-blur">
              <TimerReset className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Sale ends in</span>
              <span className="font-display font-bold tabular-nums text-foreground">
                {String(d).padStart(2, "0")}d {String(h).padStart(2, "0")}h {String(m).padStart(2, "0")}m {String(s).padStart(2, "0")}s
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="animate-pulse-glow">
                <a href="#packages">
                  <ShoppingBag className="h-4 w-4 mr-2" /> Browse Store
                </a>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <a href="https://discord.xylomc.net" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Join Discord
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Server Status Stats */}
        <section className="container -mt-8 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i} className="p-4 flex items-center justify-between hover-lift bg-card/80 backdrop-blur border-primary/10">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                    <p className={`font-display text-2xl font-black ${s.accent}`}>{s.value}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className={`h-5 w-5 ${s.accent}`} />
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Announcement Carousel */}
        <section className="container py-12">
          <div className="grid md:grid-cols-3 gap-4">
            {announcements.map((a, i) => (
              <Card key={i} className={`relative overflow-hidden p-6 group hover-lift border-primary/10`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${a.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                <div className="relative space-y-3">
                  <Badge className={`bg-gradient-to-r ${a.color} text-white border-0`}>{a.tag}</Badge>
                  <h3 className="font-display text-2xl font-bold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                  <Button size="sm" variant="secondary" asChild>
                    <a href="#packages">{a.cta} <ArrowRight className="h-3.5 w-3.5 ml-1" /></a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="container pb-14 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-3xl md:text-4xl font-black">Store <span className="text-gradient">Categories</span></h2>
              <p className="text-muted-foreground mt-2">Pick a category to start shopping.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((c) => {
                const Icon = categoryIcons[c.slug?.toLowerCase()] || categoryIcons[c.name?.toLowerCase()] || Package;
                return (
                  <a key={c.id} href={`#cat-${c.id}`} className="group">
                    <Card className="relative overflow-hidden p-6 h-full hover-lift hover-glow border-primary/10 hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300">
                      <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl group-hover:scale-125 transition-transform duration-500" />
                      <div className="relative space-y-2">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="font-display text-xl font-bold">{c.name}</h3>
                        {c.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                        )}
                        <div className="flex items-center gap-1 text-primary text-sm font-semibold pt-1">
                          View <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Packages */}
        <div id="packages" className="container py-10 space-y-10 scroll-mt-20">
          {loading ? (
            <p className="text-center text-muted-foreground py-16">Loading store...</p>
          ) : items.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <h2 className="font-display text-xl font-bold mb-1">Nothing here yet</h2>
              <p className="text-sm text-muted-foreground">Items will appear here once they're added.</p>
            </Card>
          ) : (
            <>
              {featured.length > 0 && (
                <section className="space-y-4">
                  <h2 className="font-display text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Featured
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featured.map((it) => <ItemCard key={it.id} it={it} />)}
                  </div>
                </section>
              )}

              <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="flex-wrap h-auto">
                  {tabs.map((t) => (
                    <TabsTrigger key={t.id} value={t.id}>{t.name}</TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="space-y-8">
                  {categories.map((c) =>
                    itemsByCat[c.id]?.length ? (
                      <section key={c.id} id={`cat-${c.id}`} className="space-y-3 scroll-mt-24">
                        <div>
                          <h3 className="font-display text-xl font-bold">{c.name}</h3>
                          {c.description && <p className="text-sm text-muted-foreground">{c.description}</p>}
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {itemsByCat[c.id].map((it) => <ItemCard key={it.id} it={it} />)}
                        </div>
                      </section>
                    ) : null
                  )}
                  {itemsByCat.uncategorized?.length > 0 && (
                    <section className="space-y-3">
                      <h3 className="font-display text-xl font-bold">Other</h3>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {itemsByCat.uncategorized.map((it) => <ItemCard key={it.id} it={it} />)}
                      </div>
                    </section>
                  )}
                </TabsContent>

                {categories.map((c) => (
                  <TabsContent key={c.id} value={c.id}>
                    {c.description && (
                      <p className="text-sm text-muted-foreground mb-4">{c.description}</p>
                    )}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(itemsByCat[c.id] ?? []).map((it) => <ItemCard key={it.id} it={it} />)}
                    </div>
                    {(itemsByCat[c.id] ?? []).length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No items in this category.</p>
                    )}
                  </TabsContent>
                ))}

                {itemsByCat.uncategorized?.length > 0 && (
                  <TabsContent value="uncategorized">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {itemsByCat.uncategorized.map((it) => <ItemCard key={it.id} it={it} />)}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </div>

        {/* Top Donator + Monthly Goal */}
        <section className="container py-14">
          <Card className="relative overflow-hidden p-8 md:p-10 border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-black border-0">
                  <Crown className="h-3 w-3 mr-1" /> TOP SUPPORTER
                </Badge>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center font-display text-3xl font-black text-black shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                    R
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-black">Rosie</h3>
                    <p className="text-sm text-muted-foreground">Biggest supporter this month.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground inline-flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-primary" /> Monthly Goal
                  </span>
                  <span className="font-display font-bold">
                    <span className="text-gradient">$3,200</span>
                    <span className="text-muted-foreground"> / $5,000</span>
                  </span>
                </div>
                <Progress value={64} className="h-3" />
                <p className="text-xs text-muted-foreground">64% reached — thank you to everyone supporting the server.</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Recent Payments */}
        <section className="border-t bg-card/30">
          <div className="container py-14 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-3xl md:text-4xl font-black flex items-center justify-center gap-2">
                <Receipt className="h-7 w-7 text-primary" /> Recent <span className="text-gradient">Payments</span>
              </h2>
              <p className="text-muted-foreground mt-2">Latest supporters of the server.</p>
            </div>
            <div className="max-w-2xl mx-auto space-y-3">
              {recentPayments.map((p) => (
                <Card key={p.id} className="p-4 flex items-center justify-between hover:border-primary/40 hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-display font-black text-primary-foreground">
                      {p.user.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold leading-tight">
                        <span className="text-primary">{p.user}</span> purchased {p.item}
                      </p>
                      <p className="text-xs text-muted-foreground">{p.ago}</p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-gradient">{p.price}</span>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Floating Discord Button */}
      <a
        href="https://discord.xylomc.net"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join Discord"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-primary shadow-[0_10px_30px_hsl(var(--primary)/0.5)] flex items-center justify-center hover:scale-110 transition-transform animate-pulse-glow"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </a>

      <Footer />
    </div>
  );
};

export default Store;
