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
 */
export default function HouseAdPool({ format = "rectangle", className, children }) {
  const [ad, setAd] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    const slot = houseSlotFromFormat(format);

    async function load() {
      const excludeBrands = new Set();
      const readerToken = getReaderToken();
      if (readerToken) {
        try {
          const { subscribedBrands } = await fetchVerifiedSubscriptionsForSite(readerToken);
          (subscribedBrands || []).forEach((brand) => excludeBrands.add(brand));
        } catch {
          /* best-effort — an unverified reader just sees the normal pool */
        }
      }

      try {
        const params = new URLSearchParams({ slot });
        if (excludeBrands.size) {
          params.set("exclude", Array.from(excludeBrands).join(","));
        }
        const res = await fetch(`/api/house-ads?${params}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (!cancelledRef.current) setAd(data?.ad || null);
      } catch {
        if (!cancelledRef.current) setAd(null);
      }
    }

    load();
    return () => {
      cancelledRef.current = true;
    };
  }, [format]);

  if (ad) {
    return <HouseAdImage ad={ad} placement={houseSlotFromFormat(format)} className={className} />;
  }
  return children ?? null;
}
