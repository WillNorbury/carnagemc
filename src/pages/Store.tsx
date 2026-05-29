import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import Particles from "@/components/site/Particles";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store as StoreIcon, Package, Sparkles, ExternalLink, ShoppingBag, MessageCircle, Receipt, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

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

  const ItemCard = ({ it }: { it: Item }) => (
    <Card className="overflow-hidden group hover:border-primary/50 transition-colors flex flex-col">
      <div className="aspect-video bg-muted relative overflow-hidden">
        {it.image_url ? (
          <img
            src={it.image_url}
            alt={it.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
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
      <main className="flex-1 relative">
        <section className="relative overflow-hidden border-b">
          <Particles count={28} />
          <div className="absolute inset-0 bg-grid opacity-[0.08]" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          <div className="container relative py-20 md:py-28 text-center">
            <Badge variant="secondary" className="mb-5 border-primary/40 text-primary">
              <Sparkles className="h-3 w-3 mr-1" /> Premium Perks
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-black mb-5">
              Level Up Your <span className="text-gradient">Experience</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg mb-8">
              Support the server and unlock exclusive ranks, cosmetics, and crate keys.
            </p>
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

        {categories.length > 0 && (
          <section className="container py-14 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-3xl md:text-4xl font-black">Store <span className="text-gradient">Categories</span></h2>
              <p className="text-muted-foreground mt-2">Pick a category to start shopping.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((c) => (
                <a key={c.id} href={`#cat-${c.id}`} className="group">
                  <Card className="relative overflow-hidden p-6 h-full hover-lift hover-glow border-primary/10">
                    <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-2xl group-hover:scale-125 transition-transform duration-500" />
                    <div className="relative space-y-2">
                      <Package className="h-7 w-7 text-primary" />
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
              ))}
            </div>
          </section>
        )}

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
                      <section key={c.id} className="space-y-3">
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
      </main>
      <Footer />
    </div>
  );
};

export default Store;
