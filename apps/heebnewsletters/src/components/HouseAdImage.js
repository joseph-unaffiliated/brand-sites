"use client";

import { useRef } from "react";
import Link from "next/link";
import { trackAdClick, useAdImpression } from "@publication-websites/reader-events";
import { withAmazonTag } from "@publication-websites/affiliate";
import { BRAND_PROMO_AD_TYPE } from "@publication-websites/shared-ads/house-ads";
import { amazonAssociatesTag } from "@/config/site";
import "./CrossPromoImageAd.css";

function eventAdType(houseAdType) {
  if (houseAdType === BRAND_PROMO_AD_TYPE) return "brand_promo";
  if (houseAdType === "Commerce Ads") return "commerce_ad";
  return "house_ad";
}

/** Brand promos may link to site paths (e.g. `/shop/<handle>`); keep those in the tab so the cart survives. */
function isInternalHref(href) {
  return typeof href === "string" && href.startsWith("/") && !href.startsWith("//");
}

function TrackedHouseAdLink({ ad, href, placement, className, children }) {
  const ref = useRef(null);
  const internal = isInternalHref(href);
  const finalHref = internal ? href : withAmazonTag(href, amazonAssociatesTag) || href;
  const trackProps = {
    placement,
    adType: eventAdType(ad.adType),
    destinationUrl: finalHref,
    ...(ad.brandKey ? { creativeBrand: ad.brandKey } : {}),
    ...(ad.isJewishContent ? { isJewishContent: true } : {}),
    ...(ad.promoKind ? { promoKind: ad.promoKind } : {}),
  };
  useAdImpression(ref, trackProps);
  const linkProps = internal
    ? {}
    : {
        target: "_blank",
        rel:
          ad.adType === BRAND_PROMO_AD_TYPE ? "noopener noreferrer" : "noopener noreferrer sponsored",
      };
  return (
    <div ref={ref}>
      <Link
        href={finalHref}
        {...linkProps}
        className={className}
        onClick={() => trackAdClick(trackProps)}
      >
        {children}
      </Link>
    </div>
  );
}

/**
 * Renders one Airtable creative — the shape returned by `selectHouseAd` / `selectBrandPromo`
 * in `@publication-websites/shared-ads/house-ads`. Reuses `CrossPromoImageAd.css` so pool
 * creatives and the static fallback look identical. Images are Airtable-hosted, so this uses
 * a plain `<img>` rather than `next/image`.
 */
export default function HouseAdImage({ ad, placement = "inArticle", className }) {
  if (!ad) return null;

  if (ad.kind === "sticky") {
    return (
      <div className={`cross-promo-image-sticky ${className || ""}`}>
        <TrackedHouseAdLink
          ad={ad}
          href={ad.clickUrl}
          placement="sticky"
          className="cross-promo-image-sticky-link cross-promo-image-sticky-desktop"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.desktop.imageUrl}
            alt=""
            className="cross-promo-image-sticky-img cross-promo-image-sticky-img-desktop"
          />
        </TrackedHouseAdLink>
        <TrackedHouseAdLink
          ad={ad}
          href={ad.clickUrl}
          placement="sticky"
          className="cross-promo-image-sticky-link cross-promo-image-sticky-mobile"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.mobile.imageUrl}
            alt=""
            className="cross-promo-image-sticky-img cross-promo-image-sticky-img-mobile"
          />
        </TrackedHouseAdLink>
      </div>
    );
  }

  return (
    <div className={`cross-promo-image-ad cross-promo-image-ad-${placement} ${className || ""}`}>
      <TrackedHouseAdLink
        ad={ad}
        href={ad.clickUrl}
        placement={placement}
        className="cross-promo-image-ad-link"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.imageUrl} alt="" className="cross-promo-image-ad-img" />
      </TrackedHouseAdLink>
    </div>
  );
}
