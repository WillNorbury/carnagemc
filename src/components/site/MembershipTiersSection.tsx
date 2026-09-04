import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Check, Crown, Loader2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export type MembershipTier = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  price_monthly: number | null;
  price_lifetime: number | null;
  currency: string;
  color: string;
  badge_label: string | null;
  perks: string[];
  featured: boolean;
};

const money = (value: number, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(value);

interface Props {
  title?: string;
  subtitle?: string;
  showBuy?: boolean;
  className?: string;
}

const MembershipTiersSection = ({
  title = "Membership tiers",
  subtitle = "Support Warden Network and unlock perks in-game.",
  showBuy = true,
  className = "",
}: Props) => {
  const [tiers, setTiers] = useState<MembershipTier[]>([]);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("membership_tiers")
        .select("id, name, slug, tagline, description, price_monthly, price_lifetime, currency, color, badge_label, perks, featured")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      setTiers((data ?? []) as unknown as MembershipTier[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading membership tiers…
      </div>
    );
  }

  if (tiers.length === 0) return null;

  const buy = (tier: MembershipTier, lifetime: boolean) => {
    const price = lifetime ? tier.price_lifetime : tier.price_monthly;
    if (price == null) return;
    add(
      {
        id: `membership:${tier.slug}:${lifetime ? "lifetime" : "monthly"}`,
        name: `${tier.name} — ${lifetime ? "Lifetime" : "Monthly"}`,
        price: Number(price),
        currency: tier.currency,
        image_url: null,
        external_url: null,
        maxQuantity: 1,
      },
      1,
    );
    toast.success(`${tier.name} added to your cart`);
  };

  return (
    <section className={className}>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Crown className="h-4 w-4" />
          <span className="text-[10px] font-mono uppercase tracking-[0.25em]">Memberships</span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="relative flex flex-col rounded-xl border border-border bg-card/60 p-5 backdrop-blur transition hover:border-primary/60"
            style={tier.featured ? { borderColor: tier.color } : undefined}
          >
            {tier.badge_label && (
              <span
                className="absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background"
                style={{ backgroundColor: tier.color }}
              >
                {tier.badge_label}
              </span>
            )}
            <div className="font-display text-lg font-bold" style={{ color: tier.color }}>
              {tier.name}
            </div>
            {tier.tagline && <p className="text-xs text-muted-foreground">{tier.tagline}</p>}

            <div className="mt-4">
              {tier.price_monthly != null && (
                <div className="text-2xl font-bold">
                  {money(Number(tier.price_monthly), tier.currency)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </div>
              )}
              {tier.price_lifetime != null && (
                <div className="text-xs text-muted-foreground">
                  or {money(Number(tier.price_lifetime), tier.currency)} lifetime
                </div>
              )}
            </div>

            <ul className="mt-4 space-y-1.5 text-sm">
              {(tier.perks ?? []).map((perk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{perk}</span>
                </li>
              ))}
            </ul>

            {showBuy && (
              <div className="mt-5 flex flex-col gap-2 pt-2">
                {tier.price_monthly != null && (
                  <Button size="sm" onClick={() => buy(tier, false)}>
                    Get monthly
                  </Button>
                )}
                {tier.price_lifetime != null && (
                  <Button size="sm" variant="outline" onClick={() => buy(tier, true)}>
                    Get lifetime
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default MembershipTiersSection;
