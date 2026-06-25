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
  addedAt: number;
};

type Store = {
  cart: CartItem[];
  wishlist: CartItem[];
  addToCart: (item: Omit<CartItem, "addedAt">) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  addToWishlist: (item: Omit<CartItem, "addedAt">) => void;
  removeFromWishlist: (id: string) => void;
  inCart: (id: string) => boolean;
  inWishlist: (id: string) => boolean;
  moveWishlistToCart: (id: string) => void;
};

const CartCtx = createContext<Store | null>(null);
const CART_KEY = "discover.cart.v1";
const WISH_KEY = "discover.wishlist.v1";

const load = (key: string): CartItem[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => load(CART_KEY));
  const [wishlist, setWishlist] = useState<CartItem[]>(() => load(WISH_KEY));

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

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
    setWishlist((prev) => prev.filter((p) => p.id !== id));
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

  const value = useMemo<Store>(
    () => ({
      cart,
      wishlist,
      addToCart,
      removeFromCart,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      moveWishlistToCart,
      inCart: (id) => cart.some((p) => p.id === id),
      inWishlist: (id) => wishlist.some((p) => p.id === id),
    }),
    [cart, wishlist, addToCart, removeFromCart, clearCart, addToWishlist, removeFromWishlist, moveWishlistToCart],
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};
