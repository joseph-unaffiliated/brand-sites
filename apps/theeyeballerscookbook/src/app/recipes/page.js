import { Suspense } from "react";
import { getCategories, getRecipes } from "@/lib/recipes";
import RecipesBrowser from "@/components/RecipesBrowser";
import { siteDisplayName } from "@/config/site";
import styles from "./page.module.css";

export const metadata = {
  title: `All recipes | ${siteDisplayName}`,
  description: `Browse every recipe from ${siteDisplayName} — filter by category, sort, and save your favorites.`,
  alternates: { canonical: "/recipes" },
  openGraph: {
    title: `All recipes | ${siteDisplayName}`,
    description: `Browse every recipe from ${siteDisplayName} — filter by category, sort, and save your favorites.`,
    url: "/recipes",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `All recipes | ${siteDisplayName}`,
    description: `Browse every recipe from ${siteDisplayName} — filter by category, sort, and save your favorites.`,
  },
};

export default async function RecipesPage() {
  const [recipes, categories] = await Promise.all([getRecipes(), getCategories()]);

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Recipes</p>
            <h1>Every recipe so far</h1>
          </div>
        </header>
        <Suspense fallback={null}>
          <RecipesBrowser recipes={recipes} categories={categories} />
        </Suspense>
      </div>
    </div>
  );
}
