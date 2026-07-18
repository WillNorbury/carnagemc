import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Copy, Check } from "lucide-react";

type Coupon = {
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string | null;
  expires_at: string | null;
};

export default function SaleBanner() {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("store_coupons")
        .select("code, description, discount_type, discount_value, currency, expires_at, starts_at, active, max_uses, uses_count")
        .eq("active", true)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .limit(20);
      if (cancelled || !data) return;
      const valid = data.filter((c: any) =>
        c.max_uses == null || (c.uses_count ?? 0) < c.max_uses,
      );
      // Pick largest discount (rough compare, treats % as % and fixed as $)
      valid.sort((a: any, b: any) => {
        const av = a.discount_type === "percent" ? a.discount_value : a.discount_value * 2;
        const bv = b.discount_type === "percent" ? b.discount_value : b.discount_value * 2;
        return bv - av;
      });
      setCoupon((valid[0] as Coupon) ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!coupon) return null;

  const discountLabel =
    coupon.discount_type === "percent"
      ? `${coupon.discount_value}% OFF`
      : `${(coupon.currency ?? "USD").toUpperCase()} ${Number(coupon.discount_value).toFixed(2)} OFF`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="relative overflow-hidden border border-[#ff5722]/40 bg-gradient-to-r from-[#ff5722]/10 via-[#ff5722]/5 to-transparent">
      <div className="absolute inset-y-0 left-0 w-1 bg-[#ff5722]" />
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-5 py-4 md:pl-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-[#ff5722]/15 text-[#ff5722]">
            <Tag className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono tracking-widest uppercase text-[#ff5722]">
              Active sale
            </div>
            <div className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-slate-100">
              {discountLabel}
              {coupon.description && (
                <span className="ml-2 text-sm font-normal font-['Inter'] text-[#9ca3af]">
                  {coupon.description}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-[#9ca3af]">
            Code
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 px-3 py-2 border border-[#ff5722]/60 text-[#ff5722] hover:bg-[#ff5722] hover:text-white font-mono text-sm tracking-widest uppercase transition"
          >
            {coupon.code}
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {coupon.expires_at && (
            <span className="hidden md:inline text-[10px] font-mono text-[#9ca3af]">
              ends {new Date(coupon.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
