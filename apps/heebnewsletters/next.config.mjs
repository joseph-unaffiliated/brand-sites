import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Legacy Webflow slugs (fromthevault.heebnewsletters.com/{slug}) → Sanity slugs.
 * Source of truth: ./legacy-slug-map.json (one row per tracker issue, plus
 * /beastieboys). Issues not yet imported (sanitySlug null) land on the section
 * page until their slug is filled in.
 */
function legacySlugRedirects() {
  const file = fileURLToPath(new URL("./legacy-slug-map.json", import.meta.url));
  const rows = JSON.parse(readFileSync(file, "utf8"));
  const seen = new Set();
  const out = [];
  for (const row of rows) {
    const slug = String(row.trackerSlug || "").trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({
      source: `/${slug}`,
      destination: row.sanitySlug ? `/article/${row.sanitySlug}` : "/from-the-vault",
      permanent: true,
    });
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
