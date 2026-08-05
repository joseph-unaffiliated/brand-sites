"use client";

import { useEffect, useRef, useState } from "react";
import { getReaderToken } from "@publication-websites/magic-client";
import { houseSlotFromFormat } from "@publication-websites/shared-ads/house-ads";
import { fetchVerifiedSubscriptionsForSite } from "@/lib/reader-profile";
import HouseAdImage from "./HouseAdImage";
import "./HouseAdPool.css";

/**
 * Resolves an Airtable house ad for this slot, falling back to `children` only
 * after the request settles (never while loading). Fades the result in over 200ms.
 *
 * Pass `refreshKey` (incrementing) to re-fetch and cycle creatives; the current
 * brand is excluded so the next pick prefers something different.
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
  const cancelledRef = useRef(false);
  const settledRef = useRef(false);
  const readyNotifiedRef = useRef(false);
  const currentBrandRef = useRef("");
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

  useEffect(() => {
    cancelledRef.current = false;
    const isRefresh = settledRef.current;
    if (isRefresh) setVisible(false);

    async function load() {
      const excluded = new Set(
        excludeKey
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
      );
      if (isRefresh && currentBrandRef.current) {
        excluded.add(currentBrandRef.current);
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

      try {
        const params = new URLSearchParams({ slot: houseSlotFromFormat(format) });
        if (excluded.size) {
          params.set("exclude", Array.from(excluded).join(","));
        }
        const res = await fetch(`/api/house-ads?${params}`, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        const next = data?.ad || null;
        if (cancelledRef.current) return;

        const hasFallback = childrenRef.current != null;
        const nextId = next
          ? `${next.brandKey || ""}:${next.imageUrl || next.desktop?.imageUrl || ""}`
          : hasFallback
            ? "__fallback__"
            : "__empty__";

        // Same creative after a cycle — restore visibility without flashing.
        if (isRefresh && nextId === contentIdRef.current) {
          setVisible(true);
          notifyReadyIfNeeded(next);
          return;
        }

        settledRef.current = true;
        contentIdRef.current = nextId;
        currentBrandRef.current = next?.brandKey ? String(next.brandKey) : "";
        setAd(next);
        setGeneration((g) => g + 1);
        onHouseAdRef.current?.(next);
        notifyReadyIfNeeded(next);
      } catch {
        if (cancelledRef.current) return;
        const hasFallback = childrenRef.current != null;
        const nextId = hasFallback ? "__fallback__" : "__empty__";
        if (isRefresh && nextId === contentIdRef.current) {
          setVisible(true);
          notifyReadyIfNeeded(null);
          return;
        }
        settledRef.current = true;
        contentIdRef.current = nextId;
        currentBrandRef.current = "";
        setAd(null);
        setGeneration((g) => g + 1);
        onHouseAdRef.current?.(null);
        notifyReadyIfNeeded(null);
      }
    }

    const delay = isRefresh ? 200 : 0;
    const timer = setTimeout(load, delay);
    return () => {
      cancelledRef.current = true;
      clearTimeout(timer);
    };
  }, [format, excludeKey, refreshKey]);

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
