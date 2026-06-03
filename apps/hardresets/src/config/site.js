/**
 * Per-site identity: Hard Resets.
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
  return "https://magic.hardresets.com";
}

function defaultMagicSubscribeBase() {
  const exec =
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.hardresets.com/execute";
  return exec.replace(/\/execute\/?$/, "/");
}

export const siteDisplayName =
  process.env.NEXT_PUBLIC_SITE_DISPLAY_NAME || "Hard Resets";

export const siteDefaultDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "Stories of endings and beginnings. The many ways people blow up their lives.";

export const siteFooterTagline =
  process.env.NEXT_PUBLIC_SITE_FOOTER_TAGLINE ||
  "Stories of Endings and Beginnings";

export const siteHeroTagline =
  process.env.NEXT_PUBLIC_SITE_HERO_TAGLINE ||
  "The many ways people blow up their lives";

export const siteKickerLower = siteDisplayName.toLowerCase();

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@hardresets.com";

export const subscribeCardTitle =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE || "Add Hard Resets to Your Inbox";

export const subscribeCardDek =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_DEK ||
  "Weekly profiles of hard resets—people who blew up their lives and built something new. Delivered to your inbox.";

export const siteConfig = {
  brandId: process.env.NEXT_PUBLIC_BRAND_ID || "hardresets",
  magicExecuteUrl:
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.hardresets.com/execute",
  magicReaderApiOrigin: process.env.NEXT_PUBLIC_MAGIC_READER_API_ORIGIN || defaultMagicOrigin(),
  magicSubscribeBase:
    process.env.NEXT_PUBLIC_MAGIC_SUBSCRIBE_BASE || defaultMagicSubscribeBase(),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://hardresets.com",
  typekitKitId: process.env.NEXT_PUBLIC_TYPEKIT_KIT_ID || "xon1hcs",
};

export const BRAND = siteConfig.brandId;
