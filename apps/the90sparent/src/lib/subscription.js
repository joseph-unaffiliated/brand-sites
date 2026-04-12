/**
 * Re-exports magic /execute helpers with this app’s siteConfig baked in.
 */

import { executeAction as execute, isRealBrowser, storeReaderTokenFromResponse } from "@publication-websites/magic-client";
import { siteConfig } from "@/config/site";

const magic = {
  brand: siteConfig.brandId,
  executeUrl: siteConfig.magicExecuteUrl,
};

export const BRAND = siteConfig.brandId;
export { isRealBrowser, storeReaderTokenFromResponse };

export function executeAction(searchParams, action) {
  return execute(magic, searchParams, action);
}
