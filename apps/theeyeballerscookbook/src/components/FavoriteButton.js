"use client";

import { useEffect, useState } from "react";
import { isFavorite, onFavoritesChange, toggleFavorite } from "@/lib/favorites";
import styles from "./FavoriteButton.module.css";

/**
 * Heart toggle for saving a recipe. `variant="card"` renders a compact
 * icon-only button for recipe cards; the default renders icon + label.
 */
export default function FavoriteButton({ slug, variant = "full" }) {
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

  const label = favorited ? "Saved to favorites" : "Save to favorites";

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
        <span className={styles.label}>{mounted && favorited ? "Saved" : "Save recipe"}</span>
      ) : null}
    </button>
  );
}
