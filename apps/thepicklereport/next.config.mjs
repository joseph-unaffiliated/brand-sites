/** @type {import('next').NextConfig} */
import { LEGACY_ARTICLE_REDIRECTS } from "./legacy-article-redirects.mjs";

const nextConfig = {
  /** Default cross-promo targets for this site; override in Vercel or `.env.local` if needed. */
  env: {
    NEXT_PUBLIC_SHARED_ADS_BRAND:
      process.env.NEXT_PUBLIC_SHARED_ADS_BRAND || "thepicklereport",
    NEXT_PUBLIC_SHARED_ADS_URL_RAIL:
      process.env.NEXT_PUBLIC_SHARED_ADS_URL_RAIL || "https://www.the90sparent.com",
    NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE:
      process.env.NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE ||
      "https://www.the90sparent.com/article/screenanxiety",
    NEXT_PUBLIC_SHARED_ADS_URL_STICKY:
      process.env.NEXT_PUBLIC_SHARED_ADS_URL_STICKY ||
      "https://www.the90sparent.com/article/birthdayparties",
  },
  transpilePackages: [
    "@publication-websites/shared-ads",
    "@publication-websites/web-shell",
    "@publication-websites/sanity-content",
    "@publication-websites/magic-client",
    "@publication-websites/platform-redirects",
  ],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/images/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/sarah", destination: "/article/sarah", permanent: true },
      ...LEGACY_ARTICLE_REDIRECTS,
    ];
  },
};

export default nextConfig;
