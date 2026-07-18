import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, formatMoney } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  X,
  BadgePercent,
  Tag,
  AlertCircle,
  Gift,
} from "lucide-react";

export function CartDrawer() {
  const cart = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const handleApply = async () => {
    const ok = await cart.applyCoupon(couponInput);
    if (ok) {
      setCouponInput("");
      toast.success("Coupon applied");
    }
  };

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!user) {
      toast.message("Sign in to checkout — we'll open a support ticket with your order.");
      cart.closeCart();
      nav("/auth?next=/store");
      return;
    }
    setCheckingOut(true);
    const lines = cart.items.map(
      (ci) =>
        `• ${ci.name} × ${ci.quantity} — ${formatMoney(
          (Number(ci.price) || 0) * ci.quantity,
          (ci.currency || cart.currency || "USD").toUpperCase(),
        )}${ci.recipient ? `  (gift to: ${ci.recipient})` : ""}`,
    );
    const summary = [
      "New store checkout submitted via the website.",
      "",
      "Items:",
      ...lines,
      "",
      `Subtotal: ${formatMoney(cart.subtotal, cart.currency)}`,
    ];
    if (cart.coupon && cart.discount > 0) {
      summary.push(
        `Coupon: ${cart.coupon.code} (${
          cart.coupon.discount_type === "percent"
            ? `${cart.coupon.discount_value}% off`
            : `${formatMoney(cart.coupon.discount_value, cart.currency)} off`
        })`,
      );
      summary.push(`Discount: -${formatMoney(cart.discount, cart.currency)}`);
    }
    summary.push(`Total: ${formatMoney(cart.total, cart.currency)}`);
    summary.push("", "Staff: please reply with payment instructions or fulfillment status.");
    const subject = `Store order — ${cart.count} item${
      cart.count === 1 ? "" : "s"
    } (${formatMoney(cart.total, cart.currency)})`;

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        subject,
        body: summary.join("\n"),
        category: "Store & Payments",
        priority: "normal",
        user_id: user.id,
      })
      .select("id")
      .single();
    setCheckingOut(false);
    if (error) {
      toast.error(error.message || "Could not create ticket.");
      return;
    }
    cart.clear();
    cart.closeCart();
    toast.success("Order sent — a support ticket has been created.");
    nav(`/tickets?ticket=${data.id}`);
  };

  return (
    <Sheet open={cart.isOpen} onOpenChange={(v) => (v ? cart.openCart() : cart.closeCart())}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Your Cart
            <span className="text-xs text-muted-foreground font-mono ml-1">
              ({cart.count} {cart.count === 1 ? "item" : "items"})
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Your cart is empty.
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    cart.closeCart();
                    nav("/store");
                  }}
                >
                  Browse the store
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y">
              {cart.items.map((ci) => (
                <li key={ci.id} className="flex items-center gap-3 p-3">
                  <div className="w-12 h-12 shrink-0 bg-muted overflow-hidden flex items-center justify-center rounded">
                    {ci.image_url ? (
                      <img
                        src={ci.image_url}
                        alt={ci.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{ci.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatMoney(Number(ci.price) || 0, (ci.currency || "USD").toUpperCase())} each
                    </div>
                    <div className="mt-1.5 inline-flex items-center border rounded">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => cart.setQty(ci.id, ci.quantity - 1)}
                        className="w-7 h-7 grid place-items-center hover:bg-muted"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-mono tabular-nums">
                        {ci.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => cart.setQty(ci.id, ci.quantity + 1)}
                        className="w-7 h-7 grid place-items-center hover:bg-muted"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold tabular-nums">
                      {formatMoney(
                        (Number(ci.price) || 0) * ci.quantity,
                        (ci.currency || "USD").toUpperCase(),
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${ci.name}`}
                      onClick={() => cart.remove(ci.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-muted/20">
            {/* Coupon */}
            <div className="space-y-1.5">
              {cart.coupon ? (
                <div className="flex items-center justify-between gap-2 p-2 border border-primary/40 bg-primary/5 rounded">
                  <div className="flex items-center gap-2 text-sm">
                    <BadgePercent className="h-4 w-4 text-primary" />
                    <span className="font-mono font-semibold">{cart.coupon.code}</span>
                    <span className="text-xs text-muted-foreground">
                      {cart.coupon.discount_type === "percent"
                        ? `${cart.coupon.discount_value}% off`
                        : `${formatMoney(cart.coupon.discount_value, cart.currency)} off`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={cart.clearCoupon}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove coupon"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Coupon code"
                      className="pl-7 uppercase font-mono text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApply();
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleApply}
                    disabled={cart.applyingCoupon || !couponInput.trim()}
                  >
                    {cart.applyingCoupon ? "…" : "Apply"}
                  </Button>
                </div>
              )}
              {cart.couponError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded px-2 py-1.5"
                >
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{cart.couponError}</span>
                </div>
              )}
              {cart.coupon && cart.discount === 0 && cart.subtotal < cart.coupon.min_subtotal && (
                <p className="text-xs text-muted-foreground">
                  Add {formatMoney(cart.coupon.min_subtotal - cart.subtotal, cart.currency)} more
                  to unlock this discount.
                </p>
              )}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatMoney(cart.subtotal, cart.currency)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex items-center justify-between text-primary">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatMoney(cart.discount, cart.currency)}</span>
                </div>
              )}
              <div className="flex items-center justify-between font-bold text-base pt-1 border-t">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(cart.total, cart.currency)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={cart.clear} className="flex-1">
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
              <Button
                onClick={() => {
                  cart.closeCart();
                  nav("/checkout");
                }}
                className="flex-1"
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default CartDrawer;
