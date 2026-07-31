"use client";

import { useRef } from "react";
import Link from "next/link";
import { trackAdClick, useAdImpression } from "@publication-websites/reader-events";
import "./CrossPromoImageAd.css";

function TrackedHouseAdLink({
  href,
  placement,
  className,
  creativeBrand,
  isJewishContent,
  children,
}) {
  const ref = useRef(null);
  const trackProps = {
    placement,
    adType: "house_ad",
    destinationUrl: href,
    ...(creativeBrand ? { creativeBrand } : {}),
    ...(isJewishContent ? { isJewishContent: true } : {}),
  };
  useAdImpression(ref, trackProps);
  return (
    <div ref={ref}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={className}
        onClick={() => trackAdClick(trackProps)}
      >
        {children}
      </Link>
    </div>
  );
}

/**
 * Renders one Airtable house-ad creative — the shape returned by `selectHouseAd`
 * in `@publication-websites/shared-ads/house-ads`. Reuses `CrossPromoImageAd.css`
 * classes so house ads and static cross-promo creatives look identical.
 *
 * Images are remote (Airtable-hosted, revalidated by the `/api/house-ads` route),
 * so this uses a plain `<img>` rather than `next/image`.
 */
export default function HouseAdImage({ ad, placement = "inArticle", className }) {
  if (!ad) return null;

  if (ad.kind === "sticky") {
    return (
      <div className={`cross-promo-image-sticky ${className || ""}`}>
        <TrackedHouseAdLink
          href={ad.clickUrl}
          placement="sticky"
          creativeBrand={ad.brandKey}
          isJewishContent={ad.isJewishContent}
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
          href={ad.clickUrl}
          placement="sticky"
          creativeBrand={ad.brandKey}
          isJewishContent={ad.isJewishContent}
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
        href={ad.clickUrl}
        placement={placement}
        creativeBrand={ad.brandKey}
        isJewishContent={ad.isJewishContent}
        className="cross-promo-image-ad-link"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.imageUrl} alt="" className="cross-promo-image-ad-img" />
      </TrackedHouseAdLink>
    </div>
  );
}
