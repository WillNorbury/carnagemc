import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { useCart } from "@/lib/cart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Trash2, Heart, ArrowRight, Package, Lock } from "lucide-react";

const detailBase: Record<string, string> = {
  resource_pack: "/resource-pack",
  data_pack: "/data-pack",
  shader: "/shader",
  modpack: "/modpack",
  server: "/server",
  skript: "/skript",
};

const Cart = () => {
  const { cart, removeFromCart, clearCart, addToWishlist, checkout } = useCart();
  const total = cart.reduce((s, i) => s + (i.price || 0), 0);
  const nav = useNavigate();

  const onCheckout = () => {
    const order = checkout();
    if (order) nav(`/orders?placed=${order.id}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container pt-24 pb-16 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display font-bold text-3xl flex items-center gap-2">
            <ShoppingCart className="h-7 w-7" /> Your Cart
          </h1>
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">Order history</Link>
            </Button>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear cart
              </Button>
            )}
          </div>
        </div>

        {cart.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Your cart is empty.</p>
            <Button asChild>
              <Link to="/discover/skripts">
                Browse skripts <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              {cart.map((it) => (
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Move to wishlist"
                      onClick={() => {
                        addToWishlist(it);
                        removeFromCart(it.id);
                      }}
                    >
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeFromCart(it.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <aside>
              <Card className="p-5 space-y-3">
                <h3 className="font-display font-semibold">Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span>{cart.length}</span>
                </div>
                <div className="flex justify-between text-base font-semibold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <Button className="w-full" onClick={onCheckout}>
                  <Lock className="h-4 w-4 mr-1" /> Mock checkout
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Demo only — no payment is processed. Orders save locally and unlock downloads.
                </p>
              </Card>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
