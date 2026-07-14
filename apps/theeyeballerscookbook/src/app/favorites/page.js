import Link from "next/link";
import { getRecipes } from "@/lib/recipes";
import FavoritesList from "./FavoritesList";
import { siteDisplayName } from "@/config/site";
import styles from "../recipes/page.module.css";

export const metadata = {
  title: `Favorites | ${siteDisplayName}`,
  description: `Recipes you've saved from ${siteDisplayName}.`,
  alternates: { canonical: "/favorites" },
  robots: { index: false },
};

export default async function FavoritesPage() {
  const recipes = await getRecipes();

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>
              <Link href="/recipes" className={styles.kickerLink}>
                Recipes
              </Link>
            </p>
            <h1>Your favorites</h1>
          </div>
        </header>
        <FavoritesList recipes={recipes} />
      </div>
    </div>
  );
}
