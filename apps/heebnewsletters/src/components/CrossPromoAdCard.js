"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { trackAdClick, useAdImpression } from "@publication-websites/reader-events";

const URL = process.env.NEXT_PUBLIC_CROSS_PROMO_URL || "https://hookuplists.com";
const HEADLINE = process.env.NEXT_PUBLIC_CROSS_PROMO_HEADLINE || "Hookup Lists";
const DESCRIPTION =
  process.env.NEXT_PUBLIC_CROSS_PROMO_DESCRIPTION ||
  "Curated lists and stories from our sister publication.";
const BRAND = process.env.NEXT_PUBLIC_CROSS_PROMO_BRAND_LABEL || "Hookup Lists";
const CTA = process.env.NEXT_PUBLIC_CROSS_PROMO_CTA || "Read the story";
const LOGO = process.env.NEXT_PUBLIC_CROSS_PROMO_LOGO_PATH || "/cross-promo-hl.svg";

/**
 * Branded promo card for Hookup Lists when NEXT_PUBLIC_ADS_MODE=cross_promo.
 */
export default function CrossPromoAdCard({ format = "rectangle", className }) {
  const isVertical = format === "vertical";
  const ref = useRef(null);
  const placement = format === "vertical" ? "rail" : format === "horizontal" ? "sticky" : "inArticle";
  const trackProps = {
    placement,
    adType: "cross_promo_card",
    destinationUrl: URL,
    creativeBrand: BRAND,
  };
  useAdImpression(ref, trackProps);

  return (
    <div
      ref={ref}
      className={`cross-promo-card ${isVertical ? "cross-promo-card-vertical" : ""} ${className || ""}`}
    >
      <Link
        href={URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="cross-promo-card-link"
        onClick={() => trackAdClick(trackProps)}
      >
        <div className="cross-promo-card-inner">
          <div className="cross-promo-card-logoRow">
            <Image
              src={LOGO}
              alt=""
              width={120}
              height={32}
              className="cross-promo-card-logo"
            />
            <span className="cross-promo-card-brand">{BRAND}</span>
          </div>
          <h3 className="cross-promo-card-headline">{HEADLINE}</h3>
          <p className="cross-promo-card-desc">{DESCRIPTION}</p>
          <span className="cross-promo-card-cta">{CTA}</span>
        </div>
      </Link>
    </div>
  );
}
