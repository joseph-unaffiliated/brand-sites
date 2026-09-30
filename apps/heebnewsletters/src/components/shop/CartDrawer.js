"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/lib/shopify/mappers";
import styles from "./shop.module.css";

/**
 * Slide-in cart. Quantity and remove call Shopify directly; "Checkout" hands
 * off to heebmedia.com in the same tab.
 */
export default function CartDrawer() {
  const { cart, lines, count, subtotal, isOpen, closeCart, updateItem, removeItem, checkout, pending, error, clearError, refresh } =
    useCart();
  const panelRef = useRef(null);
  // Portal only after mount so server and first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock scroll, close on Escape, refresh prices when opened.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") closeCart();
    };
    window.addEventListener("keydown", onKey);
    refresh();
    panelRef.current?.querySelector("button")?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!mounted) return null;

  const hasUnavailable = lines.some((l) => !l.availableForSale);

  return createPortal(
    <>
      <div className={`${styles.drawerBackdrop} ${isOpen ? styles.drawerBackdropOpen : ""}`} onClick={closeCart} aria-hidden />
      <aside
        ref={panelRef}
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <div className={styles.drawerHead}>
          <h2 className={styles.drawerTitle}>Your cart{count > 0 ? ` (${count})` : ""}</h2>
          <button type="button" className={styles.drawerClose} onClick={closeCart} aria-label="Close cart">
            ×
          </button>
        </div>

        <div className={styles.drawerBody}>
          {lines.length === 0 ? (
            <div className={styles.drawerEmpty}>
              <p>Your cart is empty.</p>
              <Link href="/shop" className="button button-secondary" onClick={closeCart}>
                Browse the shop
              </Link>
            </div>
          ) : (
            lines.map((line) => (
              <div key={line.id} className={styles.line}>
                <div className={styles.lineImage}>
                  {line.image ? (
                    <Image src={line.image.url} alt="" width={144} height={144} sizes="72px" />
                  ) : null}
                </div>
                <div>
                  <h3 className={styles.lineTitle}>
                    {line.productHandle ? (
                      <Link href={`/shop/${line.productHandle}`} onClick={closeCart}>
                        {line.productTitle}
                      </Link>
                    ) : (
                      line.productTitle
                    )}
                  </h3>
                  <p className={styles.lineMeta}>
                    {line.selectedOptions.map((o) => o.value).join(" · ")}
                    {line.selectedOptions.length ? " · " : ""}
                    {formatMoney(line.price)} each
                  </p>
                  {!line.availableForSale ? <p className={styles.lineUnavailable}>No longer available</p> : null}
                  <div className={styles.lineControls}>
                    <div className={styles.qty} aria-label="Quantity">
                      <button
                        type="button"
                        onClick={() => updateItem(line.id, line.quantity - 1)}
                        disabled={pending}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateItem(line.id, line.quantity + 1)}
                        disabled={pending || line.quantity >= 10}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className={styles.lineRemove} onClick={() => removeItem(line.id)} disabled={pending}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className={styles.linePrice}>{formatMoney(line.total)}</div>
              </div>
            ))
          )}
          {error ? (
            <p className={styles.errorText} style={{ marginTop: 12 }}>
              {error}{" "}
              <button type="button" className={styles.lineRemove} onClick={clearError}>
                Dismiss
              </button>
            </p>
          ) : null}
        </div>

        {lines.length > 0 ? (
          <div className={styles.drawerFoot}>
            <div className={styles.subtotalRow}>
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={checkout}
              disabled={pending || !cart?.checkoutUrl || hasUnavailable}
            >
              Checkout
            </button>
            <p className={styles.checkoutNote}>
              {hasUnavailable
                ? "Remove unavailable items to continue."
                : "Shipping and taxes are calculated at checkout."}
            </p>
          </div>
        ) : null}
      </aside>
    </>,
    document.body,
  );
}
