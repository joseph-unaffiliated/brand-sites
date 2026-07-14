"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import RecipeCard from "@/components/RecipeCard";
import styles from "@/app/recipes/page.module.css";

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "az", label: "A–Z" },
];

/**
 * Client-side category filter + sort over the full recipe list.
 * State lives in query params (?category=…&sort=…) so filtered views are shareable.
 */
export default function RecipesBrowser({ recipes, categories }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";
  const activeSort = SORTS.some((s) => s.id === searchParams.get("sort"))
    ? searchParams.get("sort")
    : "newest";

  const setParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const visible = useMemo(() => {
    let list = recipes;
    if (activeCategory) {
      list = list.filter((r) => r.category?.slug === activeCategory);
    }
    if (activeSort === "az") {
      list = [...list].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    }
    return list;
  }, [recipes, activeCategory, activeSort]);

  // Only offer categories that actually contain recipes.
  const usedCategorySlugs = new Set(
    recipes.map((r) => r.category?.slug).filter(Boolean),
  );
  const visibleCategories = categories.filter((c) => usedCategorySlugs.has(c.slug));

  return (
    <>
      <div className={styles.filterBar}>
        {visibleCategories.length > 0 && (
          <div className={styles.filterChips} role="group" aria-label="Filter by category">
            <button
              type="button"
              className={`${styles.filterChip} ${!activeCategory ? styles.filterChipActive : ""}`}
              onClick={() => setParam("category", "")}
            >
              All
            </button>
            {visibleCategories.map((category) => (
              <button
                key={category.slug}
                type="button"
                className={`${styles.filterChip} ${activeCategory === category.slug ? styles.filterChipActive : ""}`}
                onClick={() => setParam("category", category.slug)}
              >
                {category.title}
              </button>
            ))}
          </div>
        )}
        <label className={styles.sortControl}>
          <span className={styles.sortLabel}>Sort</span>
          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value === "newest" ? "" : e.target.value)}
          >
            {SORTS.map((sort) => (
              <option key={sort.id} value={sort.id}>
                {sort.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <p className={styles.emptyState}>No recipes in this category yet. Check back soon.</p>
      ) : (
        <div className={styles.issueMosaic}>
          {visible.map((recipe) => (
            <RecipeCard key={recipe._id ?? recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}
    </>
  );
}
