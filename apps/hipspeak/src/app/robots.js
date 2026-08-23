import { siteConfig } from "@/config/site";

const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "").replace(/^http:/, "https:");

export default function robots() {
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
          "/opted-out-comps",
          "/opted-in-comps",
          "/profile",
          "/request",
          "/poll",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
