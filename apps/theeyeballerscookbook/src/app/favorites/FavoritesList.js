"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import { useSubscriber } from "@/context/SubscriberContext";
import { getFavoriteSlugs, onFavoritesChange, promptSubscribeToFavorite } from "@/lib/favorites";
import styles from "../recipes/page.module.css";

export default function FavoritesList({ recipes }) {
  const { isSubscribed } = useSubscriber();
  const [slugs, setSlugs] = useState(null);

  useEffect(() => {
    if (!isSubscribed) {
      setSlugs([]);
      return;
    }
    const sync = () => setSlugs(getFavoriteSlugs());
    sync();
    return onFavoritesChange(sync);
  }, [isSubscribed]);

  // null until mounted: avoids a hydration flash of the empty state.
  if (slugs === null) return null;

  if (!isSubscribed) {
    return (
      <div className={styles.emptyState}>
        <p>
          Subscribe to save recipes you love and find them here anytime.
        </p>
        <p>
          <button
            type="button"
            className={styles.inlineSubscribe}
            onClick={() => promptSubscribeToFavorite()}
          >
            Subscribe to save favorites
          </button>
          {" · "}
          <Link href="/recipes">Browse all recipes</Link>
        </p>
      </div>
    );
  }

  const favoriteSet = new Set(slugs);
  // Most recently favorited first.
  const favorites = [...recipes]
    .filter((r) => favoriteSet.has(r.slug))
    .sort((a, b) => slugs.indexOf(b.slug) - slugs.indexOf(a.slug));

  if (favorites.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>
          You haven&apos;t saved any recipes yet. Tap the heart on any recipe to keep it here.
        </p>
        <p>
          <Link href="/recipes">Browse all recipes</Link>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.issueMosaic}>
      {favorites.map((recipe) => (
        <RecipeCard key={recipe._id ?? recipe.slug} recipe={recipe} />
      ))}
    </div>
  );
}
