/**
 * Archive taxonomy for The 90s Parent.
 * Stored on Sanity articles as `tags` (slug strings). Articles may have multiple.
 */
export const ARCHIVE_CATEGORIES = [
  {
    slug: "screens-attention",
    title: "Screens & Attention",
    description: "Tablets, TV, dopamine loops, and internet overwhelm.",
  },
  {
    slug: "safety-theater",
    title: "Safety Theater",
    description: "Risk, overprotection, allergies, and car-seat culture.",
  },
  {
    slug: "play-boredom",
    title: "Play & Boredom",
    description: "Free-range play, unstructured time, sports, and parties.",
  },
  {
    slug: "food-bodies",
    title: "Food & Bodies",
    description: "Nostalgia food, coping habits, and sleep culture.",
  },
  {
    slug: "parenting-scripts",
    title: "Parenting Scripts",
    description: "Gentle parenting, performative parenting, and roles.",
  },
  {
    slug: "the-village",
    title: "The Village",
    description: "Community, childcare, nights out, and support systems.",
  },
];

export const ARCHIVE_CATEGORY_BY_SLUG = Object.fromEntries(
  ARCHIVE_CATEGORIES.map((category) => [category.slug, category]),
);

export const ARCHIVE_CATEGORY_OPTIONS = ARCHIVE_CATEGORIES.map((category) => ({
  title: category.title,
  value: category.slug,
}));
