"use client";

import { useEffect, useState } from "react";
import { isFavorite, onFavoritesChange, toggleFavorite } from "@/lib/myWords";
import styles from "./MyWordButton.module.css";

/**
 * Heart toggle for saving a word to "My words". `variant="card"` renders a
 * compact icon-only button for word cards; the default renders icon + label.
 */
export default function MyWordButton({ slug, variant = "full" }) {
  const [favorited, setFavorited] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setFavorited(isFavorite(slug));
    return onFavoritesChange(() => setFavorited(isFavorite(slug)));
  }, [slug]);

  const handleClick = (e) => {
    // Cards wrap the button in a Link; don't navigate when toggling.
    e.preventDefault();
    e.stopPropagation();
    setFavorited(toggleFavorite(slug));
  };

  const label = favorited ? "Saved to My words" : "Save to My words";

  return (
    <button
      type="button"
      className={`${styles.button} ${variant === "card" ? styles.card : styles.full} ${favorited ? styles.active : ""}`}
      onClick={handleClick}
      aria-pressed={favorited}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      <span className={styles.heart} aria-hidden>
        {mounted && favorited ? "♥" : "♡"}
      </span>
      {variant === "full" ? (
        <span className={styles.label}>{mounted && favorited ? "Saved" : "Save word"}</span>
      ) : null}
    </button>
  );
}
