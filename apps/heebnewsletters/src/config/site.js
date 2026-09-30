/**
 * Per-site identity: Heeb Magazine (www.heebmagazine.com). From the Vault is its editorial
 * section and newsletter; the brand id, magic host, and sender stay on heebnewsletters.com.
 * Set Sanity, magic hosts, and public copy via env; tune defaults below for this brand.
 */

function defaultMagicOrigin() {
  const u = process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL;
  if (u) {
    try {
      return new URL(u).origin;
    } catch {
      /* invalid URL */
    }
  }
  return "https://magic.heebnewsletters.com";
}

function defaultMagicSubscribeBase() {
  const exec =
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.heebnewsletters.com/execute";
  return exec.replace(/\/execute\/?$/, "/");
}

export const siteDisplayName =
  process.env.NEXT_PUBLIC_SITE_DISPLAY_NAME || "Heeb Magazine";

export const siteDefaultDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "Heeb Magazine: Irreverent Jewish Counter-culture. Read From the Vault, classic Heeb stories with fresh commentary every week, and shop back issues and merch.";

export const siteFooterTagline =
  process.env.NEXT_PUBLIC_SITE_FOOTER_TAGLINE ||
  "From the Vault, in your inbox every week.";

export const siteHeroTagline =
  process.env.NEXT_PUBLIC_SITE_HERO_TAGLINE ||
  "home of the subversive jewish counter-culture";

export const siteKickerLower = siteDisplayName.toLowerCase();

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@heebnewsletters.com";

export const subscribeCardTitle =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE || "Get From the Vault";

export const subscribeCardDek =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_DEK ||
  "Join the newsletter for weekly subversive Jewish counter-culture nostalgia from the 2000s—delivered straight to your inbox.";

export const siteConfig = {
  brandId: process.env.NEXT_PUBLIC_BRAND_ID || "heebnewsletters",
  magicExecuteUrl:
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.heebnewsletters.com/execute",
  magicReaderApiOrigin: process.env.NEXT_PUBLIC_MAGIC_READER_API_ORIGIN || defaultMagicOrigin(),
  magicSubscribeBase:
    process.env.NEXT_PUBLIC_MAGIC_SUBSCRIBE_BASE || defaultMagicSubscribeBase(),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://www.heebmagazine.com",
  typekitKitId: process.env.NEXT_PUBLIC_TYPEKIT_KIT_ID || "xon1hcs",
};

/** Amazon Associates tracking ID (public; used in product URLs). */
export const amazonAssociatesTag =
  process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG || "fromthevault-20";

export const BRAND = siteConfig.brandId;

/** Staging guard: `NEXT_PUBLIC_NOINDEX=true` blocks crawlers site-wide (robots.txt + meta robots). */
export const isNoindex = process.env.NEXT_PUBLIC_NOINDEX === "true";
