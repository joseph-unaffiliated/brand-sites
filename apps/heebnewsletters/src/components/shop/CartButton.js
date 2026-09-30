"use client";

import { useCart } from "@/context/CartContext";
import styles from "./shop.module.css";

/** Header cart icon with a live count; opens the drawer. */
export default function CartButton({ className = "" }) {
  const { count, openCart, hydrated } = useCart();
  return (
    <button
      type="button"
      className={`${styles.cartButton} ${className}`.trim()}
      onClick={openCart}
      aria-label={count > 0 ? `Open cart, ${count} item${count === 1 ? "" : "s"}` : "Open cart"}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 7h12l-1 13H7L6 7z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </svg>
      {hydrated && count > 0 ? <span className={styles.cartCount}>{count > 99 ? "99+" : count}</span> : null}
    </button>
  );
}
