"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackAdClick, useAdImpression } from "@publication-websites/reader-events";
import "./CrossPromoImageAd.css";

const DEFAULT_URL = process.env.NEXT_PUBLIC_CROSS_PROMO_URL || "https://hookuplists.com";

/** Per-placement URLs; unset values fall back to `NEXT_PUBLIC_CROSS_PROMO_URL`. */
function urlForPlacement(placement) {
  const raw =
    placement === "inArticle"
      ? process.env.NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE
      : placement === "rail"
        ? process.env.NEXT_PUBLIC_SHARED_ADS_URL_RAIL
        : process.env.NEXT_PUBLIC_SHARED_ADS_URL_STICKY;
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  return trimmed || DEFAULT_URL;
}

function placementFromFormat(format) {
  if (format === "vertical") return "rail";
  if (format === "horizontal") return "sticky";
  return "inArticle";
}

/** Creatives are 2× bitmaps; layout uses logical (CSS) pixel size. */
function layout2x(intrinsic) {
  return {
    width: Math.max(1, Math.round(intrinsic.width / 2)),
    height: Math.max(1, Math.round(intrinsic.height / 2)),
  };
}

function TrackedPromoLink({ href, placement, className, creativeBrand, children }) {
  const ref = useRef(null);
  const trackProps = {
    placement,
    adType: "cross_promo",
    destinationUrl: href,
    ...(creativeBrand ? { creativeBrand } : {}),
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
 * Image-based cross-promo using `@publication-websites/shared-ads` creatives.
 * Prefer an explicit `promoUrl` from the slot config over env placement URLs.
 */
export default function CrossPromoImageAd({
  format = "rectangle",
  className,
  creatives,
  promoUrl,
  creativeBrand,
}) {
  const placement = placementFromFormat(format);
  const href = (typeof promoUrl === "string" && promoUrl.trim()) || urlForPlacement(placement);
  const brand = (creativeBrand || "").trim();

  if (placement === "sticky") {
    const d = creatives.stickyDesktop;
    const m = creatives.stickyMobile;
    if (!d || !m) return null;
    const desk = layout2x(d);
    const mob = layout2x(m);

    return (
      <div className={`cross-promo-image-sticky ${className || ""}`}>
        <TrackedPromoLink
          href={href}
          placement="sticky"
          creativeBrand={brand}
          className="cross-promo-image-sticky-link cross-promo-image-sticky-desktop"
        >
          <Image
            src={d}
            alt=""
            width={desk.width}
            height={desk.height}
            className="cross-promo-image-sticky-img cross-promo-image-sticky-img-desktop"
            sizes="(min-width: 641px) 728px, 1px"
          />
        </TrackedPromoLink>
        <TrackedPromoLink
          href={href}
          placement="sticky"
          creativeBrand={brand}
          className="cross-promo-image-sticky-link cross-promo-image-sticky-mobile"
        >
          <Image
            src={m}
            alt=""
            width={mob.width}
            height={mob.height}
            className="cross-promo-image-sticky-img cross-promo-image-sticky-img-mobile"
            sizes="(max-width: 640px) 100vw, 1px"
          />
        </TrackedPromoLink>
      </div>
    );
  }

  const img = placement === "rail" ? creatives.rail : creatives.inArticle;
  if (!img) return null;

  const lay = layout2x(img);

  return (
    <div
      className={`cross-promo-image-ad cross-promo-image-ad-${placement} ${className || ""}`}
    >
      <TrackedPromoLink
        href={href}
        placement={placement}
        creativeBrand={brand}
        className="cross-promo-image-ad-link"
      >
        <Image
          src={img}
          alt=""
          width={lay.width}
          height={lay.height}
          className="cross-promo-image-ad-img"
          sizes={
            placement === "rail"
              ? `${lay.width}px`
              : "(max-width: 640px) 100vw, 640px"
          }
        />
      </TrackedPromoLink>
    </div>
  );
}
