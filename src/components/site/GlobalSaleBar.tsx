import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { fetchStoreSale, isStoreSaleLive, type StoreSale } from "@/lib/storeSale";

type Coupon = {
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string | null;
  expires_at: string | null;
};

const useCountdown = (target: string | null) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);

  return useMemo(() => {
    if (!target) return null;
    const diff = new Date(target).getTime() - now;
    if (!Number.isFinite(diff) || diff <= 0) return null;
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return d > 0 ? `${d}d ${h}h ${pad(m)}m ${pad(sec)}s` : `${h}h ${pad(m)}m ${pad(sec)}s`;
  }, [target, now]);
};

/** Thin site-wide banner shown on every page whenever a sale/coupon is live. */
const GlobalSaleBar = () => {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [storeSale, setStoreSale] = useState<StoreSale | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data }, sale] = await Promise.all([
        supabase.rpc("list_public_coupons", { _limit: 1 }),
        fetchStoreSale(),
      ]);
      if (cancelled) return;
      setCoupon((((data as unknown as Coupon[]) ?? [])[0] as Coupon) ?? null);
      setStoreSale(isStoreSaleLive(sale) ? sale : null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const countdown = useCountdown(storeSale?.ends_at ?? coupon?.expires_at ?? null);

  if (storeSale) {
    return (
      <Link
        to="/store"
        className="relative z-50 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-primary px-4 py-1.5 text-center text-primary-foreground transition hover:brightness-110"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Sale live</span>
        <span className="opacity-60">•</span>
        <span className="text-sm font-semibold">{storeSale.label}</span>
        <span className="text-sm font-bold uppercase tracking-wide">
          {storeSale.percent}% OFF EVERYTHING
        </span>
        <span className="rounded bg-primary-foreground/15 px-2 py-0.5 text-xs font-semibold">
          No code needed
        </span>
        {countdown && (
          <span className="rounded bg-primary-foreground/15 px-2 py-0.5 font-mono text-xs font-semibold">
            Ends in {countdown}
          </span>
        )}
      </Link>
    );
  }

  if (!coupon) return null;

  const discountLabel =
    coupon.discount_type === "percent"
      ? `UP TO ${Number(coupon.discount_value)}% OFF`
      : `${(coupon.currency ?? "USD").toUpperCase()} ${Number(coupon.discount_value).toFixed(2)} OFF`;

  return (
    <Link
      to="/store"
      className="relative z-50 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-primary px-4 py-1.5 text-center text-primary-foreground transition hover:brightness-110"
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Sale live</span>
      <span className="opacity-60">•</span>
      <span className="text-sm font-semibold">{coupon.description?.trim() || "Store Sale"}</span>
      <span className="text-sm font-bold uppercase tracking-wide">{discountLabel}</span>
      <span className="rounded bg-primary-foreground/15 px-2 py-0.5 font-mono text-xs font-semibold">
        Code {coupon.code}
      </span>
      {countdown && (
        <span className="rounded bg-primary-foreground/15 px-2 py-0.5 font-mono text-xs font-semibold">
          Ends in {countdown}
        </span>
      )}
    </Link>
  );
};

export default GlobalSaleBar;
