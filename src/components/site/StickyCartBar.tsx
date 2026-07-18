import { useEffect, useState } from "react";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart, formatMoney } from "@/lib/cart";
import { useNavigate } from "react-router-dom";

/**
 * Floating sticky bar shown at the bottom of the viewport whenever the cart has items.
 * Provides a persistent shortcut to open the cart drawer or jump straight to checkout.
 */
export default function StickyCartBar() {
  const cart = useCart();
  const nav = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only after the user scrolls a bit, so it doesn't cover the hero.
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (cart.count === 0 || !visible) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-xl animate-in fade-in slide-in-from-bottom-4"
      role="region"
      aria-label="Cart summary"
    >
      <div className="flex items-center gap-3 bg-[#12121a] border border-[#ff5722]/40 shadow-2xl shadow-black/50 px-4 py-3">
        <div className="relative">
          <ShoppingCart className="w-5 h-5 text-[#ff5722]" strokeWidth={1.75} />
          <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 grid place-items-center bg-[#ff5722] text-white text-[10px] font-bold leading-none">
            {cart.count > 99 ? "99+" : cart.count}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]">
            {cart.count} item{cart.count === 1 ? "" : "s"} in cart
          </div>
          <div className="text-sm font-bold font-['Space_Grotesk'] truncate">
            {formatMoney(cart.subtotal, cart.currency)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => cart.openCart()}
          className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest border border-white/10 text-[#9ca3af] hover:border-[#ff5722] hover:text-[#ff5722] transition"
        >
          View
        </button>
        <button
          type="button"
          onClick={() => nav("/checkout")}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-[10px] font-mono uppercase tracking-widest bg-[#ff5722] text-white hover:bg-[#ff5722]/90 transition"
        >
          Checkout <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
