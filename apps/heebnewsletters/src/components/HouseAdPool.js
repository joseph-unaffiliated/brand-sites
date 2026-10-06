"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  BRAND_PROMO_AD_TYPE,
  houseSlotFromFormat,
  normalizeAdClickUrl,
  selectBrandPromo,
  selectHouseAd,
} from "@publication-websites/shared-ads/house-ads";
import { siteConfig } from "@/config/site";
import { loadHouseCreatives, readReaderAdProfile } from "@/lib/house-ad-data";
import { useHouseAdClaims } from "@/context/HouseAdClaimContext";
import HouseAdImage from "./HouseAdImage";
import "./HouseAdPool.css";

/**
 * Picks the brand's own promo or a network ad, preferring the side that owns this spot and
 * falling back to the other side when it has nothing for the slot.
 */
function pickForOwner(creatives, owner, { slot, excludeBrands, pageExcludeUrls, jewishInterested }) {
  const hostBrand = siteConfig.brandId;
  const brand = () => selectBrandPromo(creatives, { slot, hostBrand, pageExcludeUrls });
  const network = () =>
    selectHouseAd(creatives, { slot, hostBrand, excludeBrands, pageExcludeUrls, jewishInterested });
  return owner === "brand" ? brand() || network() : network() || brand();
}

/**
 * Resolves an Airtable creative for this slot, falling back to `children` (the static
 * cross-promo) only after the first pick settles. Waits while `owner` is undefined (page
 * split not decided yet). Fades the result in over 200ms.
 *
 * Bump `refreshKey` to pick again (sticky rotation). A cycle that finds nothing new keeps
 * what's on screen. Click URLs claimed by other slots on the page are skipped.
 *
 * @param {"brand" | "network" | undefined} owner Who this spot belongs to right now.
 */
export default function HouseAdPool({
  format = "rectangle",
  owner,
  className,
  children,
  onReady,
  refreshKey = 0,
}) {
  // undefined = loading; null = settled with no pool ad; object = pool ad
  const [ad, setAd] = useState(undefined);
  const [visible, setVisible] = useState(false);
  const [generation, setGeneration] = useState(0);
  const ownerId = useId();
  const claims = useHouseAdClaims();
  const reqIdRef = useRef(0);
  const settledRef = useRef(false);
  const readyNotifiedRef = useRef(false);
  const currentBrandRef = useRef("");
  const currentClickUrlRef = useRef("");
  const contentIdRef = useRef("");
  const childrenRef = useRef(children);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    childrenRef.current = children;
    onReadyRef.current = onReady;
  });

  function notifyReadyIfNeeded(next) {
    if (readyNotifiedRef.current) return;
    if (!(next || childrenRef.current != null)) return;
    readyNotifiedRef.current = true;
    onReadyRef.current?.();
  }

  function contentIdFor(next) {
    if (next) return `${next.brandKey || ""}:${next.imageUrl || next.desktop?.imageUrl || ""}`;
    return childrenRef.current != null ? "__fallback__" : "__empty__";
  }

  useEffect(() => {
    return () => {
      claims?.release(ownerId);
    };
  }, [claims, ownerId]);

  useEffect(() => {
    if (!owner) return undefined;
    const reqId = ++reqIdRef.current;
    const isRefresh = settledRef.current;

    async function loadBody() {
      const excluded = new Set();
      if (isRefresh && currentBrandRef.current && currentBrandRef.current !== siteConfig.brandId) {
        excluded.add(currentBrandRef.current);
      }
      const pageExcluded = new Set(claims?.getPageExcluded(ownerId) || []);
      if (isRefresh && currentClickUrlRef.current) {
        pageExcluded.add(currentClickUrlRef.current);
      }
      const profile = readReaderAdProfile();
      profile?.subscribedBrands.forEach((brand) => excluded.add(brand));

      const creatives = await loadHouseCreatives();
      const next = pickForOwner(creatives, owner, {
        slot: houseSlotFromFormat(format),
        excludeBrands: Array.from(excluded),
        pageExcludeUrls: Array.from(pageExcluded),
        jewishInterested: !!profile?.jewishInterested,
      });

      if (reqId !== reqIdRef.current) return null;

      const nextId = contentIdFor(next);
      if (
        isRefresh &&
        (nextId === contentIdRef.current || nextId === "__empty__" || nextId === "__fallback__")
      ) {
        return { keep: true, next };
      }

      const claimedUrl = normalizeAdClickUrl(next?.clickUrl || "");
      // Claim before releasing the queue so the next slot sees this destination.
      claims?.claim(ownerId, claimedUrl);
      return { keep: false, next, nextId, claimedUrl };
    }

    async function load() {
      const result = claims?.runExclusive
        ? await claims.runExclusive(loadBody)
        : await loadBody();

      if (reqId !== reqIdRef.current || !result) return;

      if (result.keep) {
        setVisible(true);
        notifyReadyIfNeeded(result.next);
        return;
      }

      if (isRefresh) {
        setVisible(false);
        await new Promise((r) => setTimeout(r, 200));
        if (reqId !== reqIdRef.current) return;
      }

      settledRef.current = true;
      contentIdRef.current = result.nextId;
      currentBrandRef.current = result.next?.brandKey ? String(result.next.brandKey) : "";
      currentClickUrlRef.current = result.claimedUrl || "";
      setAd(result.next);
      setGeneration((g) => g + 1);
      notifyReadyIfNeeded(result.next);
    }

    load();
    return undefined;
  }, [format, owner, refreshKey, claims, ownerId]);

  useEffect(() => {
    if (ad === undefined) return undefined;
    if (!(ad || childrenRef.current)) {
      setVisible(false);
      return undefined;
    }
    setVisible(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [generation, ad]);

  if (ad === undefined) return null;

  const content = ad ? (
    <HouseAdImage ad={ad} placement={houseSlotFromFormat(format)} className={className} />
  ) : (
    children ?? null
  );
  if (!content) return null;

  return (
    <div
      className={`house-ad-pool${visible ? " house-ad-pool--visible" : ""}`}
      data-ad-owner={ad?.adType === BRAND_PROMO_AD_TYPE ? "brand" : "network"}
    >
      {content}
    </div>
  );
}
