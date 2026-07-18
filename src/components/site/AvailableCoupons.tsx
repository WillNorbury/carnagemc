import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart, formatMoney } from "@/lib/cart";
import { BadgePercent, Loader2 } from "lucide-react";

type PublicCoupon = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string | null;
  min_subtotal: number;
  max_uses: number | null;
  uses_count: number;
  starts_at: string | null;
  expires_at: string | null;
};

type Variant = "dark" | "light";

export function AvailableCoupons({ variant = "light" }: { variant?: Variant }) {
  const cart = useCart();
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("store_coupons")
        .select(
          "id, code, description, discount_type, discount_value, currency, min_subtotal, max_uses, uses_count, starts_at, expires_at",
        )
        .eq("active", true)
        .order("discount_value", { ascending: false })
        .limit(20);
      if (cancelled) return;
      const now = Date.now();
      const eligible = ((data ?? []) as PublicCoupon[]).filter((c) => {
        if (c.starts_at && new Date(c.starts_at).getTime() > now) return false;
        if (c.expires_at && new Date(c.expires_at).getTime() < now) return false;
        if (c.max_uses != null && c.uses_count >= c.max_uses) return false;
        return true;
      });
      setCoupons(eligible.slice(0, 4));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || coupons.length === 0) return null;

  const isDark = variant === "dark";
  const box = isDark
    ? "border border-white/10 bg-[#12121a]"
    : "border rounded-md bg-muted/20";
  const chip = isDark
    ? "border border-white/10 hover:border-[#ff5722] hover:text-[#ff5722] bg-[#1a1a24]"
    : "border rounded-md hover:border-primary hover:text-primary bg-background";
  const label = isDark
    ? "text-[10px] font-mono uppercase tracking-widest text-[#9ca3af]"
    : "text-[10px] font-mono uppercase tracking-widest text-muted-foreground";

  return (
    <div className={`p-3 space-y-2 ${box}`}>
      <div className={`flex items-center gap-2 ${label}`}>
        <BadgePercent className="w-3.5 h-3.5" />
        Available coupons
      </div>
      <div className="flex flex-wrap gap-2">
        {coupons.map((c) => {
          const disc =
            c.discount_type === "percent"
              ? `${c.discount_value}% off`
              : `${formatMoney(Number(c.discount_value), (c.currency || cart.currency || "USD").toUpperCase())} off`;
          const min =
            Number(c.min_subtotal) > 0
              ? ` · min ${formatMoney(Number(c.min_subtotal), (c.currency || cart.currency || "USD").toUpperCase())}`
              : "";
          const isApplied = cart.coupon?.id === c.id;
          const isBusy = applying === c.code;
          return (
            <button
              key={c.id}
              type="button"
              disabled={isApplied || isBusy}
              onClick={async () => {
                setApplying(c.code);
                await cart.applyCoupon(c.code);
                setApplying(null);
              }}
              className={`inline-flex items-center gap-2 px-2.5 py-1.5 text-xs transition ${chip} ${
                isApplied ? "opacity-60 cursor-default" : ""
              }`}
              title={c.description ?? undefined}
            >
              {isBusy ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <BadgePercent className="w-3 h-3" />
              )}
              <span className="font-mono font-semibold">{c.code}</span>
              <span className="opacity-70">
                — {disc}
                {min}
              </span>
              {isApplied ? <span className="opacity-70">· applied</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
