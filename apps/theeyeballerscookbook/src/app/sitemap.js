import { getCategories, getRecipes } from "@/lib/recipes";
import { siteConfig } from "@/config/site";

const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "");

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/recipes", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

function toDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap() {
  const now = new Date();

  const recipes = await getRecipes().catch(() => []);
  const categories = await getCategories().catch(() => []);

  const recipeEntries = recipes
    .filter((recipe) => recipe?.slug && !recipe?.noIndex)
    .map((recipe) => ({
      url: `${SITE_URL}/recipe/${recipe.slug}`,
      lastModified:
        toDate(recipe.dateModified) ??
        toDate(recipe.publishedDate) ??
        now,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  const categoryEntries = categories
    .filter((category) => category?.slug)
    .map((category) => ({
      url: `${SITE_URL}/recipes/category/${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}` || SITE_URL,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [...staticEntries, ...categoryEntries, ...recipeEntries];
}
