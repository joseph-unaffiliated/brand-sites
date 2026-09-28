import { isNoindex, siteConfig } from "@/config/site";

const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "").replace(/^http:/, "https:");

export default function robots() {
  if (isNoindex) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/ads.txt"],
        disallow: [
          "/api/",
          "/dev/",
          "/redirect",
          "/subscribed",
          "/unsubscribed",
          "/snoozed",
          "/opted-in-comps",
          "/opted-out-comps",
          "/profile",
          "/request",
          "/sign-in",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
