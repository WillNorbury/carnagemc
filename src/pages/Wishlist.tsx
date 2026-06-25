import { Link } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { useCart } from "@/lib/cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, ShoppingCart, ArrowRight, Package } from "lucide-react";

const detailBase: Record<string, string> = {
  resource_pack: "/resource-pack",
  data_pack: "/data-pack",
  shader: "/shader",
  modpack: "/modpack",
  server: "/server",
  skript: "/skript",
};

const Wishlist = () => {
  const { wishlist, removeFromWishlist, moveWishlistToCart } = useCart();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-4xl">
        <h1 className="font-display font-bold text-3xl flex items-center gap-2 mb-6">
          <Heart className="h-7 w-7" /> Your Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
            <Button asChild>
              <Link to="/discover/skripts">
                Browse skripts <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {wishlist.map((it) => (
              <Card key={it.id} className="p-4 flex items-center gap-4">
                {it.icon_url ? (
                  <img src={it.icon_url} alt="" className="h-14 w-14 rounded-md object-cover border border-border" />
                ) : (
                  <div className="h-14 w-14 rounded-md bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    to={`${detailBase[it.kind] ?? "#"}/${it.slug ?? it.id}`}
                    className="font-semibold hover:text-primary truncate block"
                  >
                    {it.name}
                  </Link>
                  {it.author && (
                    <p className="text-xs text-muted-foreground">by {it.author}</p>
                  )}
                </div>
                <div className="font-display font-bold">
                  {it.price > 0 ? `$${it.price.toFixed(2)}` : "Free"}
                </div>
                <Button size="sm" onClick={() => moveWishlistToCart(it.id)}>
                  <ShoppingCart className="h-4 w-4 mr-1" /> Add to cart
                </Button>
                <Button variant="ghost" size="icon" onClick={() => removeFromWishlist(it.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
