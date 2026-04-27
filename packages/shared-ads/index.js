import the90sparentInArticle from "./the90sparent/tnp-inarticlead.png";
import the90sparentRail from "./the90sparent/tnp-railad.png";
import the90sparentStickyDesktop from "./the90sparent/tnp-stickyfooter-desktop.png";
import the90sparentStickyMobile from "./the90sparent/tnp-stickyfooter-mobile.png";

import thepicklereportInArticle from "./thepicklereport/tpr-inarticlead.png";
import thepicklereportRail from "./thepicklereport/tpr-railad.png";
import thepicklereportStickyDesktop from "./thepicklereport/tpr-stickyfooter-desktop.png";
import thepicklereportStickyMobile from "./thepicklereport/tpr-stickyfooter-mobile.png";

/**
 * Creative sets keyed by folder name under `packages/shared-ads/<key>/`.
 * Host sites set `NEXT_PUBLIC_SHARED_ADS_BRAND` to one of these keys so they never
 * load their own brand’s folder by mistake (each app picks an advertiser explicitly).
 */
export const sharedAdSets = {
  the90sparent: {
    inArticle: the90sparentInArticle,
    rail: the90sparentRail,
    stickyDesktop: the90sparentStickyDesktop,
    stickyMobile: the90sparentStickyMobile,
  },
  thepicklereport: {
    inArticle: thepicklereportInArticle,
    rail: thepicklereportRail,
    stickyDesktop: thepicklereportStickyDesktop,
    stickyMobile: thepicklereportStickyMobile,
  },
};
