"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCart } from "@/context/CartContext";
import { useSubscriber } from "@/context/SubscriberContext";
import { formatMoney } from "@/lib/shopify/mappers";
import CheckoutEmailModal, { EMAIL_PATTERN } from "./CheckoutEmailModal";
import styles from "./shop.module.css";

/**
 * Slide-in cart. Quantity and remove call Shopify directly; "Checkout" asks for an
 * email, then hands off to heebmedia.com in the same tab. Signed-in subscribers skip
 * the email step: their stored email goes on the cart and checkout opens directly.
 */
export default function CartDrawer() {
  const {
    cart,
    lines,
    count,
    subtotal,
    isOpen,
    closeCart,
    updateItem,
    removeItem,
    pending,
    error,
    clearError,
    refresh,
    prepareCheckout,
  } = useCart();
  const { isSubscribed, email: subscriberEmail } = useSubscriber();
  const knownEmail = isSubscribed && EMAIL_PATTERN.test(subscriberEmail?.trim() || "") ? subscriberEmail.trim() : null;
  const [leaving, setLeaving] = useState(false);
  // Back from checkout can restore this page from bfcache with the button still busy.
  useEffect(() => {
    const onShow = (e) => {
      if (e.persisted) setLeaving(false);
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  const panelRef = useRef(null);
  // Portal only after mount so server and first client render match.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [emailStep, setEmailStep] = useState(false);
  const emailStepRef = useRef(false);
  useEffect(() => {
    emailStepRef.current = emailStep;
  }, [emailStep]);
  // Reopening the cart starts from the cart, not the email step.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setEmailStep(false);
  }

  // Lock scroll, close on Escape, refresh prices when opened.
  useEffect(() => {
    if (!isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (emailStepRef.current) setEmailStep(false);
      else closeCart();
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

  async function startCheckout() {
    if (!knownEmail) {
      setEmailStep(true);
      return;
    }
    setLeaving(true);
    try {
      const checkoutUrl = await prepareCheckout(knownEmail);
      if (!checkoutUrl) throw new Error("Checkout is unavailable right now.");
      window.location.assign(checkoutUrl);
    } catch {
      setLeaving(false);
      setEmailStep(true);
    }
  }

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
              onClick={startCheckout}
              disabled={pending || leaving || !cart?.checkoutUrl || hasUnavailable}
            >
              {leaving ? "One moment…" : "Checkout"}
            </button>
            <p className={styles.checkoutNote}>
              {hasUnavailable
                ? "Remove unavailable items to continue."
                : "Shipping and taxes are calculated at checkout."}
            </p>
          </div>
        ) : null}
      </aside>
      {isOpen && emailStep ? <CheckoutEmailModal onClose={() => setEmailStep(false)} /> : null}
    </>,
    document.body,
  );
}
