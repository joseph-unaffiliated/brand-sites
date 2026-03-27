/**
 * Per-site identity: The Pickle Report (second publication template).
 * Set Sanity and imagery via env; replace `public/` assets for this brand.
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
  return "https://magic.thepicklereport.com";
}

export const siteConfig = {
  brandId: process.env.NEXT_PUBLIC_BRAND_ID || "thepicklereport",
  magicExecuteUrl:
    process.env.NEXT_PUBLIC_MAGIC_EXECUTE_URL || "https://magic.thepicklereport.com/execute",
  magicReaderApiOrigin: process.env.NEXT_PUBLIC_MAGIC_READER_API_ORIGIN || defaultMagicOrigin(),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://thepicklereport.com",
  typekitKitId: process.env.NEXT_PUBLIC_TYPEKIT_KIT_ID || "xon1hcs",
};

export const BRAND = siteConfig.brandId;
