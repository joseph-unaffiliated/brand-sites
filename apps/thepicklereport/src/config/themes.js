/**
 * Archive taxonomy for The Pickle Report.
 * Stored on Sanity articles as `themes` (slug strings). Articles may have multiple.
 */
export const ARCHIVE_THEMES = [
  {
    slug: "history-origins",
    title: "Pickle History & Origins",
    description: "Where pickles came from, and how they got everywhere.",
  },
  {
    slug: "pop-culture-trends",
    title: "Pop Culture & Trends",
    description: "Celebrity pickles, internet microcultures, and fashion moments.",
  },
  {
    slug: "science-curiosities",
    title: "Pickle Science & Curiosities",
    description: "The weird science and biology behind the brine.",
  },
  {
    slug: "business-industry",
    title: "Pickle Business & Industry",
    description: "The market, the makers, and the money in pickles.",
  },
  {
    slug: "faith-sacred",
    title: "Faith & the Sacred Pickle",
    description: "Priests, prayers, and pickles as a matter of faith.",
  },
  {
    slug: "fandom-community",
    title: "Pickle Fandom & Community",
    description: "The obsessives, the debates, and the pickle-related chaos.",
  },
];

export const ARCHIVE_THEME_BY_SLUG = Object.fromEntries(
  ARCHIVE_THEMES.map((theme) => [theme.slug, theme]),
);

export const ARCHIVE_THEME_OPTIONS = ARCHIVE_THEMES.map((theme) => ({
  title: theme.title,
  value: theme.slug,
}));
