import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategories, getRecipes } from "@/lib/recipes";
import RecipeCard from "@/components/RecipeCard";
import { siteDisplayName } from "@/config/site";
import styles from "../../page.module.css";

// Dynamic like the rest of the app: the root layout reads request headers,
// which is incompatible with SSG routes (throws for params unknown at build).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return { title: siteDisplayName };

  const title = `${category.title} recipes | ${siteDisplayName}`;
  const description =
    category.description ||
    `Every ${category.title.toLowerCase()} recipe from ${siteDisplayName}, eyeballed as always.`;

  return {
    title,
    description,
    alternates: { canonical: `/recipes/category/${slug}` },
    openGraph: { title, description, url: `/recipes/category/${slug}`, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const [recipes, categories] = await Promise.all([getRecipes(), getCategories()]);
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  const categoryRecipes = recipes.filter((r) => r.category?.slug === slug);

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
            <h1>{category.title}</h1>
            {category.description ? (
              <p className={styles.categoryDescription}>{category.description}</p>
            ) : null}
          </div>
        </header>
        {categoryRecipes.length === 0 ? (
          <p className={styles.emptyState}>
            No recipes in this category yet. <Link href="/recipes">Browse all recipes</Link>.
          </p>
        ) : (
          <div className={styles.issueMosaic}>
            {categoryRecipes.map((recipe) => (
              <RecipeCard key={recipe._id ?? recipe.slug} recipe={recipe} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
