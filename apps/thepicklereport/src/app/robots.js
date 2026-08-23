import { siteConfig } from "@/config/site";
import { anyGiveawayListed } from "@/config/giveaways";

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
          "/profile",
          "/request",
          "/poll",
          "/sign-in",
          ...(anyGiveawayListed() ? [] : ["/giveaway"]),
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
