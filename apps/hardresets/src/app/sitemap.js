import { getArticles } from "@/lib/articles";
import { siteConfig } from "@/config/site";

const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "");

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/archive", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/ai-policy", changeFrequency: "yearly", priority: 0.3 },
];

function toDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap() {
  const now = new Date();

  const articles = await getArticles().catch(() => []);

  const articleEntries = articles
    .filter((article) => article?.slug && !article?.noIndex)
    .map((article) => ({
      url: `${SITE_URL}/article/${article.slug}`,
      lastModified:
        toDate(article.dateModified) ??
        toDate(article.publishedDate) ??
        now,
      changeFrequency: "monthly",
      priority: 0.8,
    }));

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path === "/" ? "" : route.path}` || SITE_URL,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [...staticEntries, ...articleEntries];
}
