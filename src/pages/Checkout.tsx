import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import { useCart, formatMoney } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BadgePercent,
  Gift,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from "lucide-react";

export default function Checkout() {
  const cart = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const applyCoupon = async () => {
    const ok = await cart.applyCoupon(couponInput);
    if (ok) {
      setCouponInput("");
      toast.success("Coupon applied");
    }
  };

  const checkout = async () => {
    if (cart.items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!user) {
      toast.message("Sign in to complete checkout — we'll open a support ticket with your order.");
      nav("/auth?next=/checkout");
      return;
    }
    setSubmitting(true);
    const lines = cart.items.flatMap((ci) => {
      const base = `• ${ci.name} × ${ci.quantity} — ${formatMoney(
        (Number(ci.price) || 0) * ci.quantity,
        (ci.currency || cart.currency || "USD").toUpperCase(),
      )}${ci.recipient ? `  (gift to: ${ci.recipient})` : ""}`;
      const extras: string[] = [];
      if (ci.giftMessage) extras.push(`   ↳ Message: ${ci.giftMessage}`);
      return [base, ...extras];
    });

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
    if (cart.bundleDiscount > 0) {
      summary.push(
        `Bundle discount: ${cart.bundlePercent}% off (-${formatMoney(cart.bundleDiscount, cart.currency)})`,
      );
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
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Could not create ticket.");
      return;
    }

    // Fire-and-forget order confirmation email
    if (user.email) {
      const currency = (cart.currency || "USD").toUpperCase();
      const emailItems = cart.items.map((ci) => ({
        name: ci.name,
        quantity: ci.quantity,
        priceFormatted: formatMoney(
          (Number(ci.price) || 0) * ci.quantity,
          (ci.currency || cart.currency || "USD").toUpperCase(),
        ),
        recipient: ci.recipient ?? null,
        giftMessage: ci.giftMessage ?? null,

      }));
      const couponSummary = cart.coupon
        ? cart.coupon.discount_type === "percent"
          ? `${cart.coupon.discount_value}% off`
          : `${formatMoney(cart.coupon.discount_value, currency)} off`
        : null;
      const bundleSummary =
        cart.bundleDiscount > 0
          ? `Bundle discount: ${cart.bundlePercent}% off (−${formatMoney(cart.bundleDiscount, currency)})`
          : null;
      supabase.functions
        .invoke("send-transactional-email", {
          body: {
            templateName: "order-confirmation",
            recipientEmail: user.email,
            idempotencyKey: `order-confirm-${data.id}`,
            templateData: {
              recipientName:
                (user.user_metadata as any)?.username ||
                (user.user_metadata as any)?.full_name ||
                user.email.split("@")[0],
              orderId: data.id,
              items: emailItems,
              subtotalFormatted: formatMoney(cart.subtotal, currency),
              couponCode: cart.coupon?.code ?? null,
              couponSummary,
              discountFormatted:
                cart.discount > 0 ? formatMoney(cart.discount, currency) : null,
              bundleSummary,
              totalFormatted: formatMoney(cart.total, currency),
              ticketUrl: `${window.location.origin}/me/orders`,
            },
          },
        })
        .catch(() => {
          /* non-blocking */
        });
    }

    cart.clear();
    toast.success("Order sent — a support ticket has been created.");
    nav(`/tickets?ticket=${data.id}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-slate-100">
      <Helmet>
        <title>Checkout — CarnageMC Store</title>
        <meta name="description" content="Review your cart, apply a coupon, and complete checkout." />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <Navbar />
      <main className="flex-1 w-full font-['Inter']">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
          <Link
            to="/store"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#9ca3af] hover:text-[#ff5722] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Continue shopping
          </Link>

          <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-6">
            <div className="space-y-1">
              <span className="text-[#ff5722] font-mono text-xs tracking-widest uppercase">
                Marketplace
              </span>
              <h1 className="text-5xl md:text-6xl font-bold font-['Space_Grotesk'] tracking-tighter italic">
                CHECKOUT
              </h1>
            </div>
            <div className="text-xs font-mono text-[#9ca3af] tracking-widest hidden sm:block">
              {cart.count} {cart.count === 1 ? "ITEM" : "ITEMS"}
            </div>
          </div>

          {cart.items.length === 0 ? (
            <div className="border border-white/10 bg-[#12121a] p-10 text-center space-y-3">
              <ShoppingCart className="w-8 h-8 mx-auto text-[#ff5722]" />
              <h2 className="text-2xl font-bold font-['Space_Grotesk']">Your cart is empty</h2>
              <p className="text-[#9ca3af]">Browse the store and add a package to check out.</p>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff5722] text-white text-xs font-mono uppercase tracking-widest hover:bg-[#ff5722]/90 transition"
              >
                Go to store
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Items */}
              <section className="lg:col-span-2 bg-[#12121a] border border-white/10">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <ShoppingCart className="w-4 h-4 text-[#ff5722]" />
                  <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em]">
                    Order items
                  </h2>
                  <div className="flex-1 h-px bg-white/5" />
                  <button
                    onClick={cart.clear}
                    className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af] hover:text-[#ff5722] transition inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
                <ul className="divide-y divide-white/5">
                  {cart.items.map((ci) => {
                    const giftEligible = (ci.maxQuantity ?? 99) === 1;
                    return (
                    <li key={ci.id} className="px-5 py-4 space-y-3">
                      <div className="flex items-center gap-4">
                      <Link
                        to={`/store/package/${ci.id}`}
                        className="w-14 h-14 shrink-0 bg-[#1a1a24] border border-white/5 overflow-hidden flex items-center justify-center"
                      >
                        {ci.image_url ? (
                          <img
                            src={ci.image_url}
                            alt={ci.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-[#ff5722]" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/store/package/${ci.id}`}
                          className="font-bold font-['Space_Grotesk'] truncate hover:text-[#ff5722] transition"
                        >
                          {ci.name}
                        </Link>
                        <div className="text-xs text-[#9ca3af] font-mono">
                          {formatMoney(Number(ci.price) || 0, (ci.currency || "USD").toUpperCase())} each
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
                      </div>
                      {giftEligible && (
                        <div className="flex items-center gap-2 pl-[72px] text-xs">
                          <Gift className="w-3.5 h-3.5 text-[#ff5722] shrink-0" />
                          <span className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
                            Gift to
                          </span>
                          <input
                            type="text"
                            value={ci.recipient ?? ""}
                            onChange={(e) => cart.setRecipient(ci.id, e.target.value)}
                            placeholder="Minecraft username (optional)"
                            maxLength={32}
                            className="flex-1 max-w-xs px-2 py-1 bg-[#1a1a24] border border-white/10 focus:border-[#ff5722] focus:outline-none text-xs font-mono text-slate-100 placeholder:text-[#5f6472]"
                          />
                        </div>
                      )}
                    </li>
                    );
                  })}
                </ul>
              </section>

              {/* Summary */}
              <aside className="bg-[#12121a] border border-white/10 h-fit lg:sticky lg:top-24">
                <div className="px-5 py-4 border-b border-white/5">
                  <h2 className="text-sm font-mono text-[#ff5722] uppercase tracking-[0.3em]">
                    Summary
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  {/* Coupon */}
                  <div className="space-y-2">
                    {cart.coupon ? (
                      <div className="flex items-center justify-between gap-2 p-2 border border-[#ff5722]/50 bg-[#ff5722]/5">
                        <div className="flex items-center gap-2 text-sm min-w-0">
                          <BadgePercent className="h-4 w-4 text-[#ff5722] shrink-0" />
                          <span className="font-mono font-semibold truncate">
                            {cart.coupon.code}
                          </span>
                          <span className="text-xs text-[#9ca3af] font-mono truncate">
                            {cart.coupon.discount_type === "percent"
                              ? `${cart.coupon.discount_value}% off`
                              : `${formatMoney(cart.coupon.discount_value, cart.currency)} off`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={cart.clearCoupon}
                          className="text-[#9ca3af] hover:text-[#ff5722]"
                          aria-label="Remove coupon"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5f6472]" />
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") applyCoupon();
                            }}
                            placeholder="COUPON CODE"
                            className="w-full pl-7 pr-2 py-2 bg-[#1a1a24] border border-white/10 focus:border-[#ff5722] focus:outline-none text-xs font-mono uppercase tracking-widest text-slate-100 placeholder:text-[#5f6472]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={applyCoupon}
                          disabled={cart.applyingCoupon || !couponInput.trim()}
                          className="px-4 py-2 text-[10px] font-mono tracking-widest uppercase border border-white/10 text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722] transition disabled:opacity-50"
                        >
                          {cart.applyingCoupon ? "…" : "Apply"}
                        </button>
                      </div>
                    )}
                    {cart.couponError && (
                      <div
                        role="alert"
                        className="flex items-start gap-2 text-xs font-mono text-red-300 bg-red-500/10 border border-red-500/40 px-2.5 py-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{cart.couponError}</span>
                      </div>
                    )}
                    {cart.coupon && cart.discount === 0 && cart.subtotal < cart.coupon.min_subtotal && (
                      <p className="text-xs text-[#9ca3af] font-mono">
                        Add {formatMoney(cart.coupon.min_subtotal - cart.subtotal, cart.currency)}{" "}
                        more to unlock this discount.
                      </p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="space-y-1.5 text-sm border-t border-white/5 pt-4">
                    <div className="flex items-center justify-between text-[#9ca3af]">
                      <span className="text-xs font-mono uppercase tracking-widest">Subtotal</span>
                      <span className="tabular-nums font-mono">
                        {formatMoney(cart.subtotal, cart.currency)}
                      </span>
                    </div>
                    {cart.discount > 0 && (
                      <div className="flex items-center justify-between text-[#ff5722]">
                        <span className="text-xs font-mono uppercase tracking-widest">
                          Discount
                        </span>
                        <span className="tabular-nums font-mono">
                          −{formatMoney(cart.discount, cart.currency)}
                        </span>
                      </div>
                    )}
                    {cart.bundleDiscount > 0 && (
                      <div className="flex items-center justify-between text-[#ff5722]">
                        <span className="text-xs font-mono uppercase tracking-widest">
                          Bundle {cart.bundlePercent}%
                        </span>
                        <span className="tabular-nums font-mono">
                          −{formatMoney(cart.bundleDiscount, cart.currency)}
                        </span>
                      </div>
                    )}
                    {cart.nextBundle && (
                      <p className="text-[11px] text-[#9ca3af] font-mono">
                        + {cart.nextBundle.minItems - cart.count} more item
                        {cart.nextBundle.minItems - cart.count === 1 ? "" : "s"} → {cart.nextBundle.percent}% bundle discount
                      </p>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#9ca3af]">
                        Total
                      </span>
                      <span className="text-2xl font-bold font-['Space_Grotesk'] tabular-nums">
                        {formatMoney(cart.total, cart.currency)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={checkout}
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#ff5722] hover:bg-[#ff5722]/90 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-mono tracking-widest uppercase transition"
                  >
                    {submitting ? "Sending…" : "Complete checkout"}
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                  {!user && (
                    <p className="text-[11px] text-[#9ca3af] font-mono text-center">
                      You'll be asked to sign in to complete your order.
                    </p>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
