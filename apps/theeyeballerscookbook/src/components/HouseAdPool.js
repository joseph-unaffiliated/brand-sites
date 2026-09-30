"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  houseSlotFromFormat,
  normalizeAdClickUrl,
  selectHouseAd,
  SPARKLOOP_REC_KIND,
} from "@publication-websites/shared-ads/house-ads";
import { siteConfig } from "@/config/site";
import { loadHouseCreatives, readReaderAdProfile } from "@/lib/house-ad-data";
import { useHouseAdClaims } from "@/context/HouseAdClaimContext";
import HouseAdImage from "./HouseAdImage";
import SparkloopRecAd from "./SparkloopRecAd";
import "./HouseAdPool.css";

/** The 160px rail is too narrow for an email field, so it only shows SparkLoop to known readers. */
function canShowSparkloopIn(format) {
  if (houseSlotFromFormat(format) !== "rail") return true;
  try {
    return !!localStorage.getItem(`email_${siteConfig.brandId}`);
  } catch {
    return false;
  }
}

/**
 * Resolves an Airtable house ad for this slot, falling back to `children` only
 * after the *initial* request settles (never while loading). Fades the result in
 * over 200ms.
 *
 * Pass `refreshKey` (incrementing) to re-fetch and cycle creatives; the current
 * brand is excluded so the next pick prefers something different. If a cycle
 * finds nothing new, the current creative is kept (no fallback flash).
 *
 * When wrapped in `HouseAdClaimProvider`, click URLs already used by other slots
 * on this page are excluded so two ads never share a destination (supply allowing).
 *
 * Verified readers with `jewishInterested` may receive creatives marked
 * `Target for CE` (House Ads and Commerce Ads). The separate `Flag for CE`
 * checkbox is analytics-only and does not gate who sees the ad.
 *
 * A "SparkLoop Rec" pick is claimed page-wide (one per page view), pinned through
 * refresh cycles, and swapped for a house ad if SparkLoop has nothing to show. Rail
 * slots only take it for readers whose email we already have.
 *
 * @param {string[]} [excludeBrands] Extra brand keys to exclude (e.g. the other rail ad).
 * @param {(ad: object | null) => void} [onHouseAd] Called when the house-ad result settles.
 * @param {() => void} [onReady] Called once when there is something to display.
 * @param {number} [refreshKey] Bump to re-select an ad (used for timed cycling).
 */
export default function HouseAdPool({
  format = "rectangle",
  className,
  children,
  excludeBrands = [],
  onHouseAd,
  onReady,
  refreshKey = 0,
}) {
  // undefined = loading; null = settled with no house ad; object = house ad
  const [ad, setAd] = useState(undefined);
  const [visible, setVisible] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [sparkloopFallbackKey, setSparkloopFallbackKey] = useState(0);
  const ownerId = useId();
  const claims = useHouseAdClaims();
  const reqIdRef = useRef(0);
  const settledRef = useRef(false);
  const readyNotifiedRef = useRef(false);
  const currentBrandRef = useRef("");
  const currentClickUrlRef = useRef("");
  const contentIdRef = useRef("");
  const currentKindRef = useRef("");
  const forceFreshRef = useRef(false);
  const childrenRef = useRef(children);
  childrenRef.current = children;
  const onHouseAdRef = useRef(onHouseAd);
  onHouseAdRef.current = onHouseAd;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const excludeKey = Array.isArray(excludeBrands)
    ? excludeBrands.filter(Boolean).join(",")
    : "";

  function notifyReady() {
    if (readyNotifiedRef.current) return;
    readyNotifiedRef.current = true;
    onReadyRef.current?.();
  }

  function notifyReadyIfNeeded(next) {
    // SparkLoop reports ready itself once a recommendation has loaded.
    if (next?.kind === SPARKLOOP_REC_KIND) return;
    if (!(next || childrenRef.current != null)) return;
    notifyReady();
  }

  function handleSparkloopEmpty() {
    claims?.markSparkloopEmpty?.(ownerId);
    currentKindRef.current = "";
    forceFreshRef.current = true;
    setSparkloopFallbackKey((k) => k + 1);
  }

  function contentIdFor(next) {
    if (next?.kind === SPARKLOOP_REC_KIND) return `sparkloop:${next.id}`;
    if (next) {
      return `${next.brandKey || ""}:${next.imageUrl || next.desktop?.imageUrl || ""}`;
    }
    return childrenRef.current != null ? "__fallback__" : "__empty__";
  }

  useEffect(() => {
    return () => {
      claims?.release(ownerId);
    };
  }, [claims, ownerId]);

  useEffect(() => {
    const reqId = ++reqIdRef.current;
    const isRefresh = settledRef.current && !forceFreshRef.current;
    forceFreshRef.current = false;

    async function loadBody() {
      if (isRefresh && currentKindRef.current === SPARKLOOP_REC_KIND) {
        return { keep: true, pinned: true, next: null };
      }
      const excluded = new Set(
        excludeKey
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
      );
      if (isRefresh && currentBrandRef.current) {
        excluded.add(currentBrandRef.current);
      }
      const pageExcluded = new Set(claims?.getPageExcluded(ownerId) || []);
      if (isRefresh && currentClickUrlRef.current) {
        pageExcluded.add(currentClickUrlRef.current);
      }
      // Last verified profile; refreshed in the background so the next page is up to date.
      const profile = readReaderAdProfile();
      profile?.subscribedBrands.forEach((brand) => excluded.add(brand));

      const creatives = await loadHouseCreatives();
      const next = selectHouseAd(creatives, {
        slot: houseSlotFromFormat(format),
        hostBrand: siteConfig.brandId,
        excludeBrands: Array.from(excluded),
        pageExcludeUrls: Array.from(pageExcluded),
        jewishInterested: !!profile?.jewishInterested,
        includeSparkloop:
          !!claims?.canClaimSparkloop?.(ownerId) && canShowSparkloopIn(format),
      });

      if (reqId !== reqIdRef.current) return null;

      const nextId = contentIdFor(next);

      // Cycle found nothing new (or empty pool) — keep what's on screen.
      if (
        isRefresh &&
        (nextId === contentIdRef.current || nextId === "__empty__" || nextId === "__fallback__")
      ) {
        return { keep: true, next };
      }

      const claimedUrl = normalizeAdClickUrl(next?.clickUrl || "");
      // Claim before releasing the queue so the next slot sees this destination.
      claims?.claim(ownerId, claimedUrl);
      if (next?.kind === SPARKLOOP_REC_KIND) claims?.claimSparkloop(ownerId);
      return { keep: false, next, nextId, claimedUrl };
    }

    async function load() {
      const result = claims?.runExclusive
        ? await claims.runExclusive(loadBody)
        : await loadBody();

      if (reqId !== reqIdRef.current || !result) return;

      if (result.pinned) return;
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
      currentKindRef.current = result.next?.kind || "";
      currentBrandRef.current = result.next?.brandKey ? String(result.next.brandKey) : "";
      currentClickUrlRef.current = result.claimedUrl || "";
      setAd(result.next);
      setGeneration((g) => g + 1);
      onHouseAdRef.current?.(result.next);
      notifyReadyIfNeeded(result.next);
    }

    load();
  }, [format, excludeKey, refreshKey, sparkloopFallbackKey, claims, ownerId]);

  useEffect(() => {
    if (generation === 0 && ad === undefined) return;
    if (ad === undefined) return;
    const hasContent = Boolean(ad || childrenRef.current);
    if (!hasContent) {
      setVisible(false);
      return;
    }
    setVisible(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [generation, ad]);

  if (ad === undefined) return null;

  const content = ad?.kind === SPARKLOOP_REC_KIND ? (
    <SparkloopRecAd
      placement={houseSlotFromFormat(format)}
      className={className}
      onReady={notifyReady}
      onEmpty={handleSparkloopEmpty}
    />
  ) : ad ? (
    <HouseAdImage ad={ad} placement={houseSlotFromFormat(format)} className={className} />
  ) : (
    children ?? null
  );
  if (!content) return null;

  return (
    <div className={`house-ad-pool${visible ? " house-ad-pool--visible" : ""}`}>{content}</div>
  );
}
