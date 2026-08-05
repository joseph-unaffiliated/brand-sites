"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getReaderToken } from "@publication-websites/magic-client";
import {
  houseSlotFromFormat,
  normalizeAdClickUrl,
} from "@publication-websites/shared-ads/house-ads";
import { fetchVerifiedSubscriptionsForSite } from "@/lib/reader-profile";
import { useHouseAdClaims } from "@/context/HouseAdClaimContext";
import HouseAdImage from "./HouseAdImage";
import "./HouseAdPool.css";

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
  const ownerId = useId();
  const claims = useHouseAdClaims();
  const reqIdRef = useRef(0);
  const settledRef = useRef(false);
  const readyNotifiedRef = useRef(false);
  const currentBrandRef = useRef("");
  const currentClickUrlRef = useRef("");
  const contentIdRef = useRef("");
  const childrenRef = useRef(children);
  childrenRef.current = children;
  const onHouseAdRef = useRef(onHouseAd);
  onHouseAdRef.current = onHouseAd;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const excludeKey = Array.isArray(excludeBrands)
    ? excludeBrands.filter(Boolean).join(",")
    : "";

  function notifyReadyIfNeeded(next) {
    if (readyNotifiedRef.current) return;
    if (!(next || childrenRef.current != null)) return;
    readyNotifiedRef.current = true;
    onReadyRef.current?.();
  }

  function contentIdFor(next) {
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
    const isRefresh = settledRef.current;

    async function loadBody() {
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
      const readerToken = getReaderToken();
      if (readerToken) {
        try {
          const { subscribedBrands } = await fetchVerifiedSubscriptionsForSite(readerToken);
          (subscribedBrands || []).forEach((brand) => excluded.add(brand));
        } catch {
          /* best-effort — an unverified reader just sees the normal pool */
        }
      }

      let next = null;
      try {
        const params = new URLSearchParams({ slot: houseSlotFromFormat(format) });
        if (excluded.size) {
          params.set("exclude", Array.from(excluded).join(","));
        }
        for (const url of pageExcluded) {
          params.append("pageExcludeUrl", url);
        }
        const res = await fetch(`/api/house-ads?${params}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        next = data?.ad || null;
      } catch {
        next = null;
      }

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
      onHouseAdRef.current?.(result.next);
      notifyReadyIfNeeded(result.next);
    }

    load();
  }, [format, excludeKey, refreshKey, claims, ownerId]);

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

  const content = ad ? (
    <HouseAdImage ad={ad} placement={houseSlotFromFormat(format)} className={className} />
  ) : (
    children ?? null
  );
  if (!content) return null;

  return (
    <div className={`house-ad-pool${visible ? " house-ad-pool--visible" : ""}`}>{content}</div>
  );
}
