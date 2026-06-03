"use client";

import Image from "next/image";
import Link from "next/link";

const URL = process.env.NEXT_PUBLIC_CROSS_PROMO_URL || "https://thepicklereport.com";
const HEADLINE = process.env.NEXT_PUBLIC_CROSS_PROMO_HEADLINE || "The Pickle Report";
const DESCRIPTION =
  process.env.NEXT_PUBLIC_CROSS_PROMO_DESCRIPTION ||
  "Weekly pickle news, trivia, and more from our sister publication.";
const BRAND = process.env.NEXT_PUBLIC_CROSS_PROMO_BRAND_LABEL || "The Pickle Report";
const CTA = process.env.NEXT_PUBLIC_CROSS_PROMO_CTA || "Read the story";
const LOGO = process.env.NEXT_PUBLIC_CROSS_PROMO_LOGO_PATH || "/cross-promo-hl.svg";

/** Fallback branded promo card when shared-ads creatives are unavailable. */
export default function CrossPromoAdCard({ format = "rectangle", className }) {
  const isVertical = format === "vertical";

  return (
    <div
      className={`cross-promo-card ${isVertical ? "cross-promo-card-vertical" : ""} ${className || ""}`}
    >
      <Link
        href={URL}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="cross-promo-card-link"
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
