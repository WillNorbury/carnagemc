import { supabase } from "@/integrations/supabase/client";

export const STORE_SALE_KEY = "store_sale";

export type StoreSale = {
  active: boolean;
  percent: number;
  label: string;
  ends_at: string | null;
};

export const emptyStoreSale: StoreSale = {
  active: false,
  percent: 0,
  label: "Store-wide sale",
  ends_at: null,
};

export const parseStoreSale = (value: unknown): StoreSale => {
  const v = (value ?? {}) as Partial<StoreSale>;
  return {
    active: Boolean(v.active),
    percent: Math.max(0, Math.min(100, Number(v.percent) || 0)),
    label: typeof v.label === "string" && v.label.trim() ? v.label : emptyStoreSale.label,
    ends_at: typeof v.ends_at === "string" && v.ends_at ? v.ends_at : null,
  };
};

/** A sale only counts when it's switched on, has a percent and hasn't expired. */
export const isStoreSaleLive = (sale: StoreSale | null): sale is StoreSale =>
  !!sale &&
  sale.active &&
  sale.percent > 0 &&
  !(sale.ends_at && new Date(sale.ends_at).getTime() < Date.now());

export async function fetchStoreSale(): Promise<StoreSale | null> {
  const { data } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", STORE_SALE_KEY)
    .maybeSingle();
  if (!data) return null;
  return parseStoreSale(data.value);
}

export async function saveStoreSale(sale: StoreSale) {
  return supabase
    .from("site_content")
    .upsert({ key: STORE_SALE_KEY, value: sale as never }, { onConflict: "key" });
}
