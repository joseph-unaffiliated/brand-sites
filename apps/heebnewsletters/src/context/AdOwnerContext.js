"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Share of ad impressions that go to Heeb's own promos (Airtable `Ad type = Brand Promo`);
 * the rest go to the network pool. With both rail and bottom on screen the page gives the
 * brand exactly one of them, which is only a fair split at 0.5.
 */
export const BRAND_AD_SHARE = 0.5;

/** Matches the article rail breakpoint in `app/article/[slug]/page.module.css`. */
const RAIL_VISIBLE_QUERY = "(min-width: 769px)";

const AdOwnerContext = createContext(null);

function coinFlip() {
  return Math.random() < BRAND_AD_SHARE;
}

/**
 * Decides once per page view which ad spots belong to the brand vs the network:
 * one of rail/bottom each (swapped at random), or a single flip for bottom when the rail is
 * hidden. The sticky bar starts on a random side and alternates on every rotation.
 * Owners are `undefined` until mounted so slots don't pick before the split is known.
 */
export function AdOwnerProvider({ hasRail = true, children }) {
  const [owners, setOwners] = useState(null);

  useEffect(() => {
    const railShown =
      hasRail && typeof window !== "undefined" && window.matchMedia(RAIL_VISIBLE_QUERY).matches;
    const brandFirst = coinFlip();
    setOwners({
      rail: railShown ? (brandFirst ? "brand" : "network") : "network",
      bottom: railShown ? (brandFirst ? "network" : "brand") : coinFlip() ? "brand" : "network",
      stickyStartsBrand: coinFlip(),
    });
  }, [hasRail]);

  const stickyOwner = useCallback(
    (rotation = 0) => {
      if (!owners) return undefined;
      const brand = owners.stickyStartsBrand !== (rotation % 2 === 1);
      return brand ? "brand" : "network";
    },
    [owners]
  );

  const value = useMemo(
    () => ({
      ownerFor: (spot) => (owners ? owners[spot] : undefined),
      stickyOwner,
    }),
    [owners, stickyOwner]
  );

  return <AdOwnerContext.Provider value={value}>{children}</AdOwnerContext.Provider>;
}

/**
 * Owner for an ad spot ("rail" | "bottom" | "sticky"). Outside the provider every spot is
 * the network's. Returns `undefined` while the page split is still being decided.
 */
export function useAdOwner(spot, rotation = 0) {
  const ctx = useContext(AdOwnerContext);
  if (!ctx) return "network";
  return spot === "sticky" ? ctx.stickyOwner(rotation) : ctx.ownerFor(spot);
}
