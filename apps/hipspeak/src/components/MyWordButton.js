"use client";

import { useEffect, useState } from "react";
import { isFavorite, onFavoritesChange, toggleFavorite } from "@/lib/myWords";
import styles from "./MyWordButton.module.css";

/**
 * Same path for both states — the filled ♥ shape. Unsaved = stroke outline; saved = solid fill.
 */
function HeartIcon({ filled }) {
  return (
    <svg
      className={styles.heart}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden
      focusable="false"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.75}
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    e.preventDefault();
    e.stopPropagation();
    setFavorited(toggleFavorite(slug));
  };

  const showFilled = mounted && favorited;
  const label = favorited ? "Saved to My words" : "Save to My words";

  return (
    <button
      type="button"
      className={`${styles.button} ${variant === "card" ? styles.card : styles.full} ${showFilled ? styles.active : ""}`}
      onClick={handleClick}
      aria-pressed={showFilled}
      aria-label={label}
      title={label}
      suppressHydrationWarning
    >
      <HeartIcon filled={showFilled} />
      {variant === "full" ? (
        <span className={styles.label}>{showFilled ? "Saved" : "Save word"}</span>
      ) : null}
    </button>
  );
}
