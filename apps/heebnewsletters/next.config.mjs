import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Legacy Webflow slugs (fromthevault.heebnewsletters.com/{slug}) → Sanity slugs.
 * Source of truth: ./legacy-slug-map.json (one row per tracker issue, plus the
 * /beastieboys alias). Sanity slugs are the tracker slugs; issues not yet
 * imported (sanitySlug null) land on the section page until it is filled in.
 * Alias rows also redirect `/article/{trackerSlug}`, and `previousSanitySlug`
 * (the long headline slugs used before 2026-10-07) redirects to the current one.
 */
function legacySlugRedirects() {
  const file = fileURLToPath(new URL("./legacy-slug-map.json", import.meta.url));
  const rows = JSON.parse(readFileSync(file, "utf8"));
  const seen = new Set();
  const out = [];
  const add = (source, destination) => {
    if (seen.has(source) || source === destination) return;
    seen.add(source);
    out.push({ source, destination, permanent: true });
  };
  for (const row of rows) {
    const slug = String(row.trackerSlug || "").trim();
    if (!slug) continue;
    const destination = row.sanitySlug ? `/article/${row.sanitySlug}` : "/from-the-vault";
    add(`/${slug}`, destination);
    if (row.sanitySlug) add(`/article/${slug}`, destination);
    if (row.previousSanitySlug) add(`/article/${row.previousSanitySlug}`, destination);
  }
  return out;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@publication-websites/affiliate",
    "@publication-websites/shared-ads",
    "@publication-websites/web-shell",
    "@publication-websites/sanity-content",
    "@publication-websites/magic-client",
    "@publication-websites/platform-redirects",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
      { protocol: "https", hostname: "cdn.shopify.com", pathname: "/s/files/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/archive", destination: "/from-the-vault", permanent: true },
      // Shopify-style paths (shared from heebmedia.com or guessed) → the on-site shop.
      { source: "/products/:handle", destination: "/shop/:handle", permanent: true },
      { source: "/collections/:handle", destination: "/shop?collection=:handle", permanent: true },
      { source: "/collections", destination: "/shop", permanent: true },
      ...legacySlugRedirects(),
    ];
  },
};

export default nextConfig;
