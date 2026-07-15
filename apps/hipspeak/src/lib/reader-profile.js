/** Re-export reader-profile package with site magic origin baked in. */
export {
  getReaderToken,
  clearReaderToken,
  fetchVerifiedSubscriptions,
  fetchReaderProfile,
  isReaderProfileV2Enabled,
} from "@publication-websites/reader-profile";

import { siteConfig } from "@/config/site";
import {
  fetchVerifiedSubscriptions as fetchVerifiedSubscriptionsBase,
  fetchReaderProfile as fetchReaderProfileBase,
} from "@publication-websites/reader-profile";

/** @param {string | null} readerToken */
export function fetchVerifiedSubscriptionsForSite(readerToken) {
  return fetchVerifiedSubscriptionsBase(readerToken, siteConfig.magicReaderApiOrigin);
}

/** @param {string | null} readerToken */
export function fetchReaderProfileForSite(readerToken) {
  return fetchReaderProfileBase(
    readerToken,
    siteConfig.magicReaderApiOrigin,
    siteConfig.brandId,
  );
}
