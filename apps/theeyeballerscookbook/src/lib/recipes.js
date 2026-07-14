/**
 * Recipe data layer: wires the shared Sanity queries to this site's project.
 * Recipes are intentionally loose (no times, servings, or measured quantities) —
 * see the brand: "Recipes Without Measurements".
 */

import {
  createSanityLayer,
  createRecipeQueries,
} from "@publication-websites/sanity-content";

const layer = createSanityLayer({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
});

const queries = createRecipeQueries({
  ...layer,
  fallbackImage: process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/tec-photo.png",
});

export async function getRecipes() {
  return queries.getRecipes();
}

export async function getRecipeBySlug(slug) {
  return queries.getRecipeBySlug(slug);
}

export async function getRecipeSlugs() {
  return queries.getRecipeSlugs();
}

export async function getCategories() {
  return queries.getCategories();
}

/** The featured "recipe of the week" is simply the newest published recipe. */
export async function getLatestRecipe() {
  const recipes = await queries.getRecipes();
  return recipes[0] ?? null;
}

export function formatRecipeDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}
