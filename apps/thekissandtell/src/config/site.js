/**
 * Per-site identity: The Kiss and Tell.
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
  return "https://magic.thekissandtell.com";
}

function defaultMagicSubscribeBase() {
  const exec =
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.thekissandtell.com/execute";
  return exec.replace(/\/execute\/?$/, "/");
}

export const siteDisplayName =
  process.env.NEXT_PUBLIC_SITE_DISPLAY_NAME || "The Kiss and Tell";

export const siteDefaultDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "True stories and sharp takes on dating and relationships—delivered to your inbox.";

export const siteFooterTagline =
  process.env.NEXT_PUBLIC_SITE_FOOTER_TAGLINE ||
  "Real talk on love and connection. Delivered weekly.";

export const siteHeroTagline =
  process.env.NEXT_PUBLIC_SITE_HERO_TAGLINE ||
  "True stories on dating, relationships, and what happens after the first date.";

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@thekissandtell.com";

export const siteMonogram = process.env.NEXT_PUBLIC_SITE_MONOGRAM || "K";

/** Lowercase publication name: hide duplicate kicker when it matches the masthead. */
export const siteKickerLower = siteDisplayName.toLowerCase();

export const subscribeCardTitle =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE || "The Kiss and Tell";

export const subscribeCardDek =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_DEK ||
  "Worth reading and worth sharing—weekly stories about dating, intimacy, and modern love.";

export const siteConfig = {
  brandId: process.env.NEXT_PUBLIC_BRAND_ID || "thekissandtell",
  magicExecuteUrl:
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.thekissandtell.com/execute",
  magicReaderApiOrigin: process.env.NEXT_PUBLIC_MAGIC_READER_API_ORIGIN || defaultMagicOrigin(),
  magicSubscribeBase:
    process.env.NEXT_PUBLIC_MAGIC_SUBSCRIBE_BASE || defaultMagicSubscribeBase(),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://thekissandtell.com",
  typekitKitId: process.env.NEXT_PUBLIC_TYPEKIT_KIT_ID || "xon1hcs",
};

export const BRAND = siteConfig.brandId;
