/**
 * Per-site identity and magic host URLs (Hookup Lists).
 *
 * Non-technical readers: this is the “ID card” for this website—brand id, public URL,
 * and where the secure magic server lives. Change these via Vercel / env, not by editing code.
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
  return "https://magic.hookuplists.com";
}

export const siteConfig = {
  brandId: process.env.NEXT_PUBLIC_BRAND_ID || "hookuplists",
  /** Full URL to POST /execute on magic (must match this publication’s magic.* deploy). */
  magicExecuteUrl:
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.hookuplists.com/execute",
  /** Origin of magic host for GET /api/reader-subscriptions (Bearer reader token). */
  magicReaderApiOrigin: process.env.NEXT_PUBLIC_MAGIC_READER_API_ORIGIN || defaultMagicOrigin(),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://hookuplists.com",
  /** Adobe Fonts kit id (optional per publication). */
  typekitKitId: process.env.NEXT_PUBLIC_TYPEKIT_KIT_ID || "xon1hcs",
};

/** @deprecated use siteConfig.brandId */
export const BRAND = siteConfig.brandId;
