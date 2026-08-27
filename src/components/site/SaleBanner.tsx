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
      const { data } = await supabase.rpc("list_public_coupons", { _limit: 1 });
      if (cancelled || !data) return;
      setCoupon(((data as any[])[0] as Coupon) ?? null);
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
    <div className="relative overflow-hidden border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
      <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 px-5 py-4 md:pl-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-10 h-10 bg-primary/15 text-primary">
            <Tag className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-mono tracking-widest uppercase text-primary">
              Active sale
            </div>
            <div className="font-['Space_Grotesk'] text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {discountLabel}
              {coupon.description && (
                <span className="ml-2 text-sm font-normal font-['Inter'] text-muted-foreground">
                  {coupon.description}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <span className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Code
          </span>
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 px-3 py-2 border border-primary/60 text-primary hover:bg-primary hover:text-primary-foreground font-mono text-sm tracking-widest uppercase transition"
          >
            {coupon.code}
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {coupon.expires_at && (
            <span className="hidden md:inline text-[10px] font-mono text-muted-foreground">
              ends {new Date(coupon.expires_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
