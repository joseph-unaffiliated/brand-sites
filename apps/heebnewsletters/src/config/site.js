/**
 * Per-site identity: From the Vault, by Heeb.
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
  process.env.NEXT_PUBLIC_SITE_DISPLAY_NAME || "From the Vault, by Heeb";

export const siteDefaultDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "The 2000s in your inbox — a weekly dive into subversive Jewish counter-culture nostalgia from Heeb.";

export const siteFooterTagline =
  process.env.NEXT_PUBLIC_SITE_FOOTER_TAGLINE ||
  "The 2000s in your inbox. Delivered weekly.";

export const siteHeroTagline =
  process.env.NEXT_PUBLIC_SITE_HERO_TAGLINE || "The 2000s in your inbox";

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
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://heebnewsletters.com",
  typekitKitId: process.env.NEXT_PUBLIC_TYPEKIT_KIT_ID || "xon1hcs",
};

/** Amazon Associates tracking ID (public; used in product URLs). */
export const amazonAssociatesTag =
  process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG || "fromthevault-20";

export const BRAND = siteConfig.brandId;
