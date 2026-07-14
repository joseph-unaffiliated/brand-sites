"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import { getFavoriteSlugs, onFavoritesChange } from "@/lib/favorites";
import styles from "../recipes/page.module.css";

export default function FavoritesList({ recipes }) {
  const [slugs, setSlugs] = useState(null);

  useEffect(() => {
    const sync = () => setSlugs(getFavoriteSlugs());
    sync();
    return onFavoritesChange(sync);
  }, []);

  // null until mounted: avoids a hydration flash of the empty state.
  if (slugs === null) return null;

  const favoriteSet = new Set(slugs);
  // Most recently favorited first.
  const favorites = [...recipes]
    .filter((r) => favoriteSet.has(r.slug))
    .sort((a, b) => slugs.indexOf(b.slug) - slugs.indexOf(a.slug));

  if (favorites.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>
          You haven&apos;t saved any recipes yet. Tap the ♡ on any recipe to keep it here.
        </p>
        <p>
          <Link href="/recipes">Browse all recipes</Link> or{" "}
          <a href="/#subscribe">subscribe to get one a week</a>.
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
