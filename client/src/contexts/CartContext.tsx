import { getSakinaProductByVariant } from "@shared/commerce/catalog";
import type { Cart, CartItem, Product } from "@shared/commerce/types";
import {
  default as React,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/**
 * Website-owned SAKINA bag. It stays in localStorage until the customer
 * confirms their order, keeping the purchase journey entirely in-site.
 */

const CART_STORAGE_KEY = "sakina:local-cart";

function readStoredCart(): Cart | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) as Cart : null;
  } catch {
    return null;
  }
}

function writeStoredCart(value: Cart | null) {
  if (typeof window === "undefined") return;
  if (value) window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(value));
  else window.localStorage.removeItem(CART_STORAGE_KEY);
}

function money(amount: number) {
  return { amount: amount.toFixed(2), currencyCode: "EGP" };
}

function itemFromProduct(product: Product, quantity: number): CartItem {
  const variant = product.variants[0];
  const price = Number(variant?.price.amount ?? 0);
  return { lineId: variant?.id ?? product.id, variantId: variant?.id ?? product.id, productHandle: product.handle, productTitle: product.title, variantTitle: variant?.title ?? "Default Title", image: product.images[0] ?? null, unitPrice: money(price), quantity, lineTotal: money(price * quantity) };
}

function cartFromItems(items: CartItem[]): Cart | null {
  if (!items.length) return null;
  const subtotal = items.reduce((sum, item) => sum + Number(item.lineTotal.amount), 0);
  return { id: "sakina-local-cart", items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: money(subtotal), total: money(subtotal) };
}

type CartContextValue = {
  cart: Cart | null;
  isOpen: boolean;
  loading: boolean;
  itemCount: number;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(() => readStoredCart());
  // A deterministic preview URL keeps the app-like mobile bottom sheet easy to QA without fabricating cart data.
  const [isOpen, setIsOpen] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bag") === "open");
  const [loading] = useState(false);

  useEffect(() => {
    writeStoredCart(cart);
  }, [cart]);

  const itemCount = cart?.itemCount ?? 0;

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback(
    async (variantId: string, quantity: number = 1) => {
      const product = getSakinaProductByVariant(variantId);
      if (!product) return;
      setCart(current => {
        const currentItems = current?.items ?? [];
        const existing = currentItems.find(item => item.variantId === variantId);
        const nextItems = existing ? currentItems.map(item => item.variantId === variantId ? itemFromProduct(product, item.quantity + quantity) : item) : [...currentItems, itemFromProduct(product, quantity)];
        return cartFromItems(nextItems);
      });
      setIsOpen(true);
    },
    []
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      setCart(current => {
        const nextItems = (current?.items ?? []).flatMap(item => {
          if (item.lineId !== lineId) return [item];
          const product = getSakinaProductByVariant(item.variantId);
          return quantity > 0 && product ? [itemFromProduct(product, quantity)] : [];
        });
        return cartFromItems(nextItems);
      });
    },
    []
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      setCart(current => cartFromItems((current?.items ?? []).filter(item => item.lineId !== lineId)));
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart(null);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      loading,
      itemCount,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [
      cart,
      isOpen,
      loading,
      itemCount,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
