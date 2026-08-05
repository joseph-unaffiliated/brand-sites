"use client";

import { useEffect, useRef, useState } from "react";
import { getReaderToken } from "@publication-websites/magic-client";
import { houseSlotFromFormat } from "@publication-websites/shared-ads/house-ads";
import { fetchVerifiedSubscriptionsForSite } from "@/lib/reader-profile";
import HouseAdImage from "./HouseAdImage";

/**
 * Wraps a static cross-promo creative (`children`) with an Airtable house ad
 * when one is available for this slot. Falls back to `children` while loading,
 * when Airtable is empty/unconfigured, or when the fetch fails.
 *
 * @param {string[]} [excludeBrands] Extra brand keys to exclude (e.g. the other rail ad).
 * @param {(ad: object | null) => void} [onHouseAd] Called when the house-ad result settles.
 */
export default function HouseAdPool({
  format = "rectangle",
  className,
  children,
  excludeBrands = [],
  onHouseAd,
}) {
  const [ad, setAd] = useState(null);
  const cancelledRef = useRef(false);
  const onHouseAdRef = useRef(onHouseAd);
  onHouseAdRef.current = onHouseAd;
  const excludeKey = Array.isArray(excludeBrands)
    ? excludeBrands.filter(Boolean).join(",")
    : "";

  useEffect(() => {
    cancelledRef.current = false;
    const slot = houseSlotFromFormat(format);

    async function load() {
      const excluded = new Set(
        excludeKey
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
      );
      const readerToken = getReaderToken();
      if (readerToken) {
        try {
          const { subscribedBrands } = await fetchVerifiedSubscriptionsForSite(readerToken);
          (subscribedBrands || []).forEach((brand) => excluded.add(brand));
        } catch {
          /* best-effort — an unverified reader just sees the normal pool */
        }
      }

      try {
        const params = new URLSearchParams({ slot });
        if (excluded.size) {
          params.set("exclude", Array.from(excluded).join(","));
        }
        const res = await fetch(`/api/house-ads?${params}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const next = data?.ad || null;
        if (!cancelledRef.current) {
          setAd(next);
          onHouseAdRef.current?.(next);
        }
      } catch {
        if (!cancelledRef.current) {
          setAd(null);
          onHouseAdRef.current?.(null);
        }
      }
    }

    load();
    return () => {
      cancelledRef.current = true;
    };
  }, [format, excludeKey]);

  if (ad) {
    return <HouseAdImage ad={ad} placement={houseSlotFromFormat(format)} className={className} />;
  }
  return children ?? null;
}
