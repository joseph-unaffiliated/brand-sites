/**
 * Per-site identity: The '90s Parent.
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
  return "https://magic.the90sparent.com";
}

function defaultMagicSubscribeBase() {
  const exec =
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.the90sparent.com/execute";
  return exec.replace(/\/execute\/?$/, "/");
}

export const siteDisplayName =
  process.env.NEXT_PUBLIC_SITE_DISPLAY_NAME || "The '90s Parent";

export const siteDefaultDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "Parenting with a dial-up state of mind—humor, honesty, and a little nostalgia in your inbox every week.";

export const siteFooterTagline =
  process.env.NEXT_PUBLIC_SITE_FOOTER_TAGLINE ||
  "For parents who remember Blockbuster and still lose their keys. Delivered weekly.";

export const siteHeroTagline =
  process.env.NEXT_PUBLIC_SITE_HERO_TAGLINE ||
  "Parenting today, with one foot still in the 1990s.";

export const contactEmail =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@the90sparent.com";

/** Lowercase publication name: hide duplicate kicker when it matches the masthead. */
export const siteKickerLower = siteDisplayName.toLowerCase();

export const subscribeCardTitle =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE ||
  "We're Bringing Back the Old School";

export const subscribeCardDek =
  process.env.NEXT_PUBLIC_SUBSCRIBE_CARD_DEK ||
  "Join The 90s Parent newsletter and get a weekly breakdown of parenting hacks, tips and stories from the Millennial parents who are all that and a bag of chips, delivered straight to your inbox.";

export const siteConfig = {
  brandId: process.env.NEXT_PUBLIC_BRAND_ID || "the90sparent",
  magicExecuteUrl:
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.the90sparent.com/execute",
  magicReaderApiOrigin: process.env.NEXT_PUBLIC_MAGIC_READER_API_ORIGIN || defaultMagicOrigin(),
  magicSubscribeBase:
    process.env.NEXT_PUBLIC_MAGIC_SUBSCRIBE_BASE || defaultMagicSubscribeBase(),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://the90sparent.com",
  typekitKitId: process.env.NEXT_PUBLIC_TYPEKIT_KIT_ID || "xon1hcs",
};

export const BRAND = siteConfig.brandId;
