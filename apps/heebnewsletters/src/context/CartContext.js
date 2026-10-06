"use client";

/**
 * Shop cart state for the whole site: one Shopify cart per browser, id kept
 * in localStorage, mutations made straight from the browser.
 *
 * `prepareCheckout(email)` returns Shopify's hosted checkout URL on heebmedia.com
 * (Shopify only serves checkout on the store's primary domain).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  addLines,
  checkoutUrlWithUtm,
  createCart,
  ensureSourceAttribute,
  fetchCart,
  readStoredCartId,
  removeLines,
  setBuyerEmail,
  storeCartId,
  updateLines,
} from "@/lib/shopify/cart-client";
import { trackAddToCart, trackBeginCheckout, trackRemoveFromCart, trackViewCart } from "@/lib/shop-analytics";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [lastAdded, setLastAdded] = useState(null);
  const cartRef = useRef(null);
  cartRef.current = cart;

  // Restore the cart on first paint; drop ids Shopify no longer knows.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = readStoredCartId();
      if (!id) {
        setHydrated(true);
        return;
      }
      try {
        let restored = await fetchCart(id);
        if (restored) restored = await ensureSourceAttribute(restored);
        if (cancelled) return;
        if (restored) setCart(restored);
        else storeCartId(null);
      } catch {
        // Offline or Shopify down: keep the id, try again next visit.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep other tabs in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== "heebmagazine.cartId") return;
      const id = e.newValue;
      if (!id) setCart(null);
      else fetchCart(id).then((c) => c && setCart(c)).catch(() => {});
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const commit = useCallback((next) => {
    setCart(next);
    storeCartId(next?.id ?? null);
    return next;
  }, []);

  const run = useCallback(
    async (fn) => {
      setPending(true);
      setError(null);
      try {
        return await fn();
      } catch (err) {
        setError(err?.message || "Something went wrong. Please try again.");
        throw err;
      } finally {
        setPending(false);
      }
    },
    [],
  );

  /**
   * Add a variant. `product`/`variant` are only used for analytics and the
   * "added" confirmation, so callers can pass card-level data.
   */
  const addItem = useCallback(
    async (variantId, quantity = 1, { product, variant, openDrawer = true } = {}) => {
      if (!variantId) return null;
      const lines = [{ merchandiseId: variantId, quantity }];
      const next = await run(async () => {
        const current = cartRef.current;
        if (current?.id) {
          try {
            return await addLines(current.id, lines);
          } catch (err) {
            // Cart expired or was checked out: start a fresh one.
            if (/not found|does not exist|invalid/i.test(err?.message || "")) {
              storeCartId(null);
              return createCart(lines);
            }
            throw err;
          }
        }
        return createCart(lines);
      });
      commit(next);
      trackAddToCart(product, variant, quantity);
      setLastAdded({ product, variant, quantity, at: Date.now() });
      if (openDrawer) setIsOpen(true);
      return next;
    },
    [commit, run],
  );

  const updateItem = useCallback(
    async (lineId, quantity) => {
      const current = cartRef.current;
      if (!current?.id || !lineId) return null;
      if (quantity <= 0) {
        const line = current.lines.find((l) => l.id === lineId);
        const next = await run(() => removeLines(current.id, [lineId]));
        if (line) trackRemoveFromCart(line);
        return commit(next);
      }
      const next = await run(() => updateLines(current.id, [{ id: lineId, quantity }]));
      return commit(next);
    },
    [commit, run],
  );

  const removeItem = useCallback((lineId) => updateItem(lineId, 0), [updateItem]);

  const refresh = useCallback(async () => {
    const current = cartRef.current;
    if (!current?.id) return null;
    try {
      const next = await fetchCart(current.id);
      if (next) return commit(next);
      commit(null);
      return null;
    } catch {
      return current;
    }
  }, [commit]);

  const openCart = useCallback(() => {
    setIsOpen(true);
    if (cartRef.current) trackViewCart(cartRef.current);
  }, []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  /**
   * Attach the shopper's email to the cart (Shopify pre-fills checkout Contact with it)
   * and return the heebmedia.com checkout URL. The caller navigates, directly or via
   * the subscribe redirect.
   */
  const prepareCheckout = useCallback(
    async (email) => {
      const current = cartRef.current;
      if (!current?.id) return null;
      let next = current;
      if (email && current.buyerEmail !== email) {
        next = commit(await run(() => setBuyerEmail(current.id, email)));
      }
      const url = checkoutUrlWithUtm(next?.checkoutUrl);
      if (url) trackBeginCheckout(next);
      return url;
    },
    [commit, run],
  );

  const value = useMemo(
    () => ({
      cart,
      lines: cart?.lines ?? [],
      count: cart?.totalQuantity ?? 0,
      subtotal: cart?.subtotal ?? null,
      hydrated,
      isOpen,
      pending,
      error,
      lastAdded,
      addItem,
      updateItem,
      removeItem,
      refresh,
      openCart,
      closeCart,
      prepareCheckout,
      clearError: () => setError(null),
    }),
    [cart, hydrated, isOpen, pending, error, lastAdded, addItem, updateItem, removeItem, refresh, openCart, closeCart, prepareCheckout],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
