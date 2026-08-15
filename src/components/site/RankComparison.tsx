import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { Check, Minus, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Rank = {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  perks: string[] | null;
  sort_order: number;
};

const money = (p: number | null, c?: string | null) => {
  if (p == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (c || "USD").toUpperCase(),
    }).format(Number(p));
  } catch {
    return `$${Number(p).toFixed(2)}`;
  }
};

/** Side-by-side "what you get" grid for donor ranks — the highest-leverage store element. */
const RankComparison = () => {
  const [ranks, setRanks] = useState<Rank[]>([]);
  const cart = useCart();

  useEffect(() => {
    (async () => {
      const { data: cat } = await supabase
        .from("store_categories")
        .select("id")
        .eq("slug", "ranks")
        .maybeSingle();
      if (!cat?.id) return;
      const { data } = await supabase
        .from("store_items")
        .select("id, name, price, currency, perks, sort_order")
        .eq("category_id", cat.id)
        .eq("published", true)
        .order("sort_order", { ascending: true });
      setRanks(((data as Rank[]) ?? []).filter((r) => (r.perks ?? []).length > 0));
    })();
  }, []);

  // Union of every perk across ranks, ordered by first appearance (cheapest rank first).
  const allPerks = useMemo(() => {
    const seen: string[] = [];
    // "Everything in X" lines are redundant — inheritance is already shown by the ticks.
    const rollup = /^everything in /i;
    for (const r of ranks)
      for (const p of r.perks ?? []) if (!rollup.test(p) && !seen.includes(p)) seen.push(p);
    return seen;
  }, [ranks]);

  // A rank inherits everything from cheaper ranks (perks say "Everything in X").
  const has = (rank: Rank, perk: string) => {
    const idx = ranks.findIndex((r) => r.id === rank.id);
    for (let i = 0; i <= idx; i++) if ((ranks[i].perks ?? []).includes(perk)) return true;
    return false;
  };

  if (ranks.length < 2) return null;

  const best = ranks[ranks.length - 1];

  return (
    <section id="compare" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-primary mb-2">
            Compare
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">What each rank gets you</h2>
        </div>
        <p className="text-sm text-muted-foreground max-w-sm">
          Every rank includes everything from the ranks below it. One-time purchase, never expires.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card/60">
        <table className="w-full min-w-[720px] text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground w-[38%]">Perk</th>
              {ranks.map((r) => (
                <th key={r.id} className="p-4 text-center align-bottom">
                  <div className="flex flex-col items-center gap-1">
                    {r.id === best.id && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-primary">
                        <Crown className="h-3 w-3" /> Best value
                      </span>
                    )}
                    <Link
                      to={`/store/package/${r.id}`}
                      className="font-display font-bold text-base hover:text-primary transition"
                    >
                      {r.name.replace(/\s*Rank$/i, "")}
                    </Link>
                    <span className="font-mono text-primary">{money(r.price, r.currency)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPerks.map((perk, i) => (
              <tr key={perk} className={i % 2 ? "bg-secondary/20" : undefined}>
                <td className="p-3 px-4 border-t border-border/60">{perk}</td>
                {ranks.map((r) => (
                  <td key={r.id} className="p-3 text-center border-t border-border/60">
                    {has(r, perk) ? (
                      <Check className="h-4 w-4 text-primary mx-auto" aria-label="Included" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" aria-label="Not included" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-4 border-t border-border" />
              {ranks.map((r) => (
                <td key={r.id} className="p-4 border-t border-border text-center">
                  <Button
                    size="sm"
                    variant={r.id === best.id ? "default" : "outline"}
                    onClick={() =>
                      cart.add({
                        id: r.id,
                        name: r.name,
                        price: Number(r.price ?? 0),
                        currency: r.currency ?? "USD",
                        image_url: null,
                        external_url: null,
                        maxQuantity: 1,
                      })

                    }
                  >
                    Add to cart
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default RankComparison;
