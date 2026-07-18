import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CartItem = {
  id: string;
  name: string;
  price: number | null;
  currency: string | null;
  image_url: string | null;
  external_url: string | null;
  quantity: number;
  maxQuantity?: number | null;
  recipient?: string | null;
};


export type AppliedCoupon = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string | null;
  min_subtotal: number;
  description: string | null;
};

export type BundleTier = { minItems: number; percent: number };
export const BUNDLE_TIERS: BundleTier[] = [
  { minItems: 3, percent: 5 },
  { minItems: 5, percent: 10 },
  { minItems: 10, percent: 15 },
];

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  discount: number;
  bundleDiscount: number;
  bundlePercent: number;
  nextBundle: BundleTier | null;
  total: number;
  currency: string;
  coupon: AppliedCoupon | null;
  couponError: string | null;
  applyingCoupon: boolean;
  applyCoupon: (code: string) => Promise<boolean>;
  clearCoupon: () => void;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  setRecipient: (id: string, recipient: string | null) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "carnage.cart.v1";
const COUPON_KEY = "carnage.cart.coupon.v1";

const read = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readCoupon = (): AppliedCoupon | null => {
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppliedCoupon;
  } catch {
    return null;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() =>
    typeof window === "undefined" ? [] : read(),
  );
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(() =>
    typeof window === "undefined" ? null : readCoupon(),
  );
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
      else localStorage.removeItem(COUPON_KEY);
    } catch {}
  }, [coupon]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(read());
      if (e.key === COUPON_KEY) setCoupon(readCoupon());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: Omit<CartItem, "quantity">, qty: number = 1) => {
    setItems((prev) => {
      const cap = Math.min(99, item.maxQuantity ?? 99);
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        const effectiveCap = Math.min(99, found.maxQuantity ?? cap);
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantity: Math.min(effectiveCap, p.quantity + qty) }
            : p,
        );
      }
      return [...prev, { ...item, quantity: Math.min(cap, Math.max(1, qty)) }];
    });
  }, []);

  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((p) => p.id !== id)),
    [],
  );

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((p) => p.id !== id)
        : prev.map((p) =>
            p.id === id
              ? { ...p, quantity: Math.min(99, p.maxQuantity ?? 99, qty) }
              : p,
          ),
    );
  }, []);

  const setRecipient = useCallback((id: string, recipient: string | null) => {
    const clean = recipient ? recipient.trim().slice(0, 32) : null;
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, recipient: clean || null } : p)),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
    setCouponError(null);
  }, []);

  const clearCoupon = useCallback(() => {
    setCoupon(null);
    setCouponError(null);
  }, []);

  const applyCoupon = useCallback(async (rawCode: string) => {
    const code = rawCode.trim();
    setCouponError(null);
    if (!code) {
      setCouponError("Enter a code.");
      return false;
    }
    setApplyingCoupon(true);
    try {
      const { data, error } = await supabase
        .from("store_coupons")
        .select(
          "id, code, description, discount_type, discount_value, currency, min_subtotal, max_uses, uses_count, starts_at, expires_at, active",
        )
        .ilike("code", code)
        .maybeSingle();
      if (error) {
        setCouponError(error.message);
        return false;
      }
      if (!data) {
        setCouponError("Invalid code — check the spelling and try again.");
        return false;
      }
      if (!data.active) {
        setCouponError("This code is no longer active.");
        return false;
      }
      const now = new Date();
      if (data.starts_at && new Date(data.starts_at) > now) {
        setCouponError(
          `This code isn't active until ${new Date(data.starts_at).toLocaleString()}.`,
        );
        return false;
      }
      if (data.expires_at && new Date(data.expires_at) < now) {
        setCouponError(
          `This code expired on ${new Date(data.expires_at).toLocaleDateString()}.`,
        );
        return false;
      }
      if (data.max_uses != null && (data.uses_count ?? 0) >= data.max_uses) {
        setCouponError("This code has reached its usage limit.");
        return false;
      }
      if (Number(data.min_subtotal) > 0) {
        // Not a hard error — the coupon can still be attached; drawer/store
        // shows a helper hint until the subtotal meets the minimum.
      }
      setCoupon({
        id: data.id,
        code: data.code,
        discount_type: data.discount_type as "percent" | "fixed",
        discount_value: Number(data.discount_value) || 0,
        currency: data.currency ?? null,
        min_subtotal: Number(data.min_subtotal) || 0,
        description: data.description ?? null,
      });
      return true;
    } finally {
      setApplyingCoupon(false);
    }
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((a, b) => a + b.quantity, 0);
    const subtotal = items.reduce((a, b) => a + (Number(b.price) || 0) * b.quantity, 0);
    const currency = (items.find((i) => i.currency)?.currency || "USD").toUpperCase();
    let discount = 0;
    if (coupon && subtotal >= coupon.min_subtotal) {
      if (coupon.discount_type === "percent") {
        discount = Math.min(subtotal, (subtotal * coupon.discount_value) / 100);
      } else {
        discount = Math.min(subtotal, coupon.discount_value);
      }
    }
    const afterCoupon = Math.max(0, subtotal - discount);
    const tier = [...BUNDLE_TIERS].reverse().find((t) => count >= t.minItems) ?? null;
    const bundlePercent = tier?.percent ?? 0;
    const bundleDiscount = tier ? (afterCoupon * tier.percent) / 100 : 0;
    const nextBundle = BUNDLE_TIERS.find((t) => count < t.minItems) ?? null;
    const total = Math.max(0, afterCoupon - bundleDiscount);
    return {
      items,
      count,
      subtotal,
      discount,
      bundleDiscount,
      bundlePercent,
      nextBundle,
      total,
      currency,
      coupon,
      couponError,
      applyingCoupon,
      applyCoupon,
      clearCoupon,
      add,
      remove,
      setQty,
      setRecipient,
      clear,
      isOpen,
      openCart,
      closeCart,
    };
      add,
      remove,
      setQty,
      setRecipient,
      clear,
      isOpen,
      openCart,
      closeCart,
    };
  }, [
    items,
    coupon,
    couponError,
    applyingCoupon,
    applyCoupon,
    clearCoupon,
    add,
    remove,
    setQty,
    setRecipient,
    clear,
    isOpen,
    openCart,
    closeCart,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const formatMoney = (amount: number, currency: string = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};
