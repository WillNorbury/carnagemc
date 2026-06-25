import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import {
  Heart,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
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
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  badge: string | null;
  featured: boolean;
  external_url: string | null;
  sort_order: number;
};

const Store = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const { addToCart, addToWishlist, inCart, inWishlist, isPurchased, cart } = useCart();

  useEffect(() => {
    document.title = "Store — CarnageMC";
    (async () => {
      setLoading(true);
      const [cats, its] = await Promise.all([
        supabase
          .from("store_categories")
          .select("id, slug, name, description, icon, sort_order")
          .eq("published", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("store_items")
          .select(
            "id, category_id, name, description, price, currency, image_url, badge, featured, external_url, sort_order",
          )
          .eq("published", true)
          .order("featured", { ascending: false })
          .order("sort_order", { ascending: true }),
      ]);
      setCategories((cats.data ?? []) as Category[]);
      setItems((its.data ?? []) as Item[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((it) => {
      if (activeCat !== "all" && it.category_id !== activeCat) return false;
      if (!query) return true;
      return (
        it.name.toLowerCase().includes(query) ||
        (it.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [items, activeCat, q]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1 className="font-display font-bold text-3xl flex items-center gap-2">
              <ShoppingBag className="h-7 w-7" /> Store
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ranks, perks and cosmetics. Mock checkout — no real payment is processed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search store..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 w-56"
              />
            </div>
            <Button asChild variant="outline" size="sm">
              <a href="/cart">
                <ShoppingCart className="h-4 w-4 mr-1" /> Cart ({cart.length})
              </a>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            size="sm"
            variant={activeCat === "all" ? "default" : "outline"}
            onClick={() => setActiveCat("all")}
          >
            All
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              size="sm"
              variant={activeCat === c.id ? "default" : "outline"}
              onClick={() => setActiveCat(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>

        {loading ? (
          <Card className="p-10 text-center text-muted-foreground">Loading store...</Card>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            No items match your filters.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((it) => {
              const owned = isPurchased(it.id);
              return (
                <Card
                  key={it.id}
                  className="overflow-hidden flex flex-col hover:border-primary/50 transition"
                >
                  <div className="aspect-[16/10] bg-muted relative">
                    {it.image_url ? (
                      <img
                        src={it.image_url}
                        alt={it.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {it.featured && (
                      <Badge className="absolute top-2 left-2 bg-primary/90">
                        <Sparkles className="h-3 w-3 mr-1" /> Featured
                      </Badge>
                    )}
                    {it.badge && (
                      <Badge variant="secondary" className="absolute top-2 right-2">
                        {it.badge}
                      </Badge>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    <div>
                      <h3 className="font-display font-semibold">{it.name}</h3>
                      {it.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {it.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-auto">
                      <span className="font-display font-bold text-2xl">
                        {Number(it.price) === 0 ? "Free" : `$${Number(it.price).toFixed(2)}`}
                      </span>
                      {Number(it.price) > 0 && (
                        <span className="text-xs text-muted-foreground">{it.currency || "USD"}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        disabled={inCart(it.id) || owned}
                        onClick={() =>
                          addToCart({
                            id: it.id,
                            kind: "store_item",
                            slug: null,
                            name: it.name,
                            author: null,
                            price: Number(it.price),
                            icon_url: it.image_url,
                            external_url: it.external_url,
                          })
                        }
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        {owned ? "Owned" : inCart(it.id) ? "In cart" : "Buy"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={inWishlist(it.id)}
                        onClick={() =>
                          addToWishlist({
                            id: it.id,
                            kind: "store_item",
                            slug: null,
                            name: it.name,
                            author: null,
                            price: Number(it.price),
                            icon_url: it.image_url,
                            external_url: it.external_url,
                          })
                        }
                      >
                        <Heart className={`h-4 w-4 mr-1 ${inWishlist(it.id) ? "fill-current" : ""}`} />
                        {inWishlist(it.id) ? "Wishlisted" : "Wishlist"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Store;
