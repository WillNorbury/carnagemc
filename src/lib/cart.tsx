import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export type CartItem = {
  id: string;
  kind: string;
  slug: string | null;
  name: string;
  author: string | null;
  price: number;
  icon_url: string | null;
  storage_path?: string | null;
  file_name?: string | null;
  external_url?: string | null;
  addedAt: number;
};

export type Order = {
  id: string;
  createdAt: number;
  items: CartItem[];
  total: number;
};

type Store = {
  cart: CartItem[];
  wishlist: CartItem[];
  orders: Order[];
  addToCart: (item: Omit<CartItem, "addedAt">) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  addToWishlist: (item: Omit<CartItem, "addedAt">) => void;
  removeFromWishlist: (id: string) => void;
  inCart: (id: string) => boolean;
  inWishlist: (id: string) => boolean;
  isPurchased: (id: string) => boolean;
  moveWishlistToCart: (id: string) => void;
  checkout: () => Order | null;
};

const CartCtx = createContext<Store | null>(null);
const CART_KEY = "discover.cart.v1";
const WISH_KEY = "discover.wishlist.v1";
const ORDERS_KEY = "discover.orders.v1";

const load = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => load<CartItem[]>(CART_KEY, []));
  const [wishlist, setWishlist] = useState<CartItem[]>(() => load<CartItem[]>(WISH_KEY, []));
  const [orders, setOrders] = useState<Order[]>(() => load<Order[]>(ORDERS_KEY, []));

  useEffect(() => { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }, [orders]);

  const addToCart: Store["addToCart"] = useCallback((item) => {
    setCart((prev) => {
      if (prev.some((p) => p.id === item.id)) {
        toast.info(`${item.name} is already in your cart`);
        return prev;
      }
      toast.success(`Added ${item.name} to cart`);
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const removeFromCart: Store["removeFromCart"] = useCallback((id) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const addToWishlist: Store["addToWishlist"] = useCallback((item) => {
    setWishlist((prev) => {
      if (prev.some((p) => p.id === item.id)) {
        toast.info(`${item.name} is already in your wishlist`);
        return prev;
      }
      toast.success(`Added ${item.name} to wishlist`);
      return [...prev, { ...item, addedAt: Date.now() }];
    });
  }, []);

  const removeFromWishlist: Store["removeFromWishlist"] = useCallback((id) => {
    setWishlist((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) toast.success(`Removed ${item.name} from wishlist`);
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const moveWishlistToCart: Store["moveWishlistToCart"] = useCallback((id) => {
    setWishlist((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) {
        setCart((c) => (c.some((x) => x.id === id) ? c : [...c, { ...item, addedAt: Date.now() }]));
        toast.success(`Moved ${item.name} to cart`);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const checkout: Store["checkout"] = useCallback(() => {
    let placed: Order | null = null;
    setCart((current) => {
      if (current.length === 0) {
        toast.error("Your cart is empty");
        return current;
      }
      const order: Order = {
        id: `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
        createdAt: Date.now(),
        items: current,
        total: current.reduce((s, i) => s + (i.price || 0), 0),
      };
      placed = order;
      setOrders((o) => [order, ...o]);
      toast.success("Order placed! (mock checkout — no real payment)");
      return [];
    });
    return placed;
  }, []);

  const purchasedIds = useMemo(
    () => new Set(orders.flatMap((o) => o.items.map((i) => i.id))),
    [orders],
  );

  const value = useMemo<Store>(
    () => ({
      cart,
      wishlist,
      orders,
      addToCart,
      removeFromCart,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      moveWishlistToCart,
      checkout,
      inCart: (id) => cart.some((p) => p.id === id),
      inWishlist: (id) => wishlist.some((p) => p.id === id),
      isPurchased: (id) => purchasedIds.has(id),
    }),
    [cart, wishlist, orders, addToCart, removeFromCart, clearCart, addToWishlist, removeFromWishlist, moveWishlistToCart, checkout, purchasedIds],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
