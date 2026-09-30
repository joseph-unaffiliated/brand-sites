import { getArticles } from "@/lib/articles";
import { getProductHandles } from "@/lib/shopify/catalog";
import { getShopSettings } from "@/lib/shop-content";
import { siteConfig } from "@/config/site";

const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "");

const STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/from-the-vault", changeFrequency: "weekly", priority: 0.9 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/affiliate-disclosure", changeFrequency: "yearly", priority: 0.3 },
  { path: "/ai-policy", changeFrequency: "yearly", priority: 0.3 },
];

function toDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function sitemap() {
  const now = new Date();

  const [articles, productHandles, shopSettings] = await Promise.all([
    getArticles().catch(() => []),
    getProductHandles().catch(() => []),
    getShopSettings().catch(() => ({ hidden: [] })),
  ]);
  const hidden = new Set(shopSettings?.hidden ?? []);

  const productEntries = productHandles
    .filter(({ handle }) => handle && !hidden.has(handle))
    .map(({ handle, updatedAt }) => ({
      url: `${SITE_URL}/shop/${handle}`,
      lastModified: toDate(updatedAt) ?? now,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

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

  return [...staticEntries, ...articleEntries, ...productEntries];
}
