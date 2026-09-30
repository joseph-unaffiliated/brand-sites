"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadSparkloopClient } from "./loader.js";
import { subscribeToNetworkBrand } from "./network-subscribe.js";

/**
 * @typedef {{
 *   key: string,
 *   kind: "network" | "sparkloop",
 *   name: string,
 *   description: string,
 *   brandId?: string,
 *   executeUrl?: string,
 *   uuid?: string,
 *   type?: "paid" | "free",
 * }} PickerItem
 */

/**
 * Alternate our brands with SparkLoop recommendations, starting with ours.
 * @param {PickerItem[]} network
 * @param {PickerItem[]} sparkloop
 */
export function blendPickerItems(network, sparkloop) {
  const out = [];
  const max = Math.max(network.length, sparkloop.length);
  for (let i = 0; i < max; i += 1) {
    if (network[i]) out.push(network[i]);
    if (sparkloop[i]) out.push(sparkloop[i]);
  }
  return out;
}

/** @returns {PickerItem} */
function toSparkloopItem(rec) {
  return {
    key: `sl:${rec.uuid}`,
    kind: "sparkloop",
    uuid: rec.uuid,
    type: rec.type,
    name: rec.name,
    description: rec.description || "",
  };
}

/**
 * Blended "subscribe to more" picker: our network brands (via magic /execute) plus SparkLoop
 * Client API recommendations. Nothing is pre-selected; readers must opt in to each pick.
 *
 * SparkLoop is only generated once per mount, only for as many cards as we show, and never cached.
 * With `total`, network items (in order) fill whatever SparkLoop leaves empty, so the grid stays full.
 *
 * @param {{
 *   email: string | null,
 *   sourceBrand: string,
 *   networkItems: PickerItem[],
 *   total?: number,
 *   sparkloop?: { publicationId?: string, testMode?: boolean, limit?: number },
 * }} opts
 */
export function useNewsletterPicker({ email, sourceBrand, networkItems, total, sparkloop = {} }) {
  const { publicationId, testMode = true, limit = 3 } = sparkloop;
  const sparkloopEnabled = Boolean(email && publicationId && limit > 0);

  const [sparkloopItems, setSparkloopItems] = useState([]);
  const [sparkloopSettled, setSparkloopSettled] = useState(false);
  const loadState = sparkloopEnabled && !sparkloopSettled ? "loading" : "ready";
  const [selected, setSelected] = useState(() => new Set());
  const [submitState, setSubmitState] = useState({ status: "idle", subscribed: [], failed: [] });

  const clientRef = useRef(null);
  const generateRef = useRef(null);
  const shownRef = useRef(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    if (!sparkloopEnabled) return undefined;

    if (!generateRef.current) {
      generateRef.current = loadSparkloopClient({ publicationId, testMode }).then(async (client) => {
        clientRef.current = client;
        const recs = await client.recommendations.generate({ limit });
        return Array.isArray(recs) ? recs.slice(0, limit).map(toSparkloopItem) : [];
      });
    }

    let cancelled = false;
    generateRef.current
      .then((items) => {
        if (cancelled) return;
        setSparkloopItems(items);
        setSparkloopSettled(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn("SparkLoop recommendations unavailable:", err?.message || err);
        setSparkloopSettled(true);
      });

    return () => {
      cancelled = true;
    };
  }, [sparkloopEnabled, publicationId, testMode, limit]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const observeRecommendation = useCallback((el) => {
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const uuid = entry.target.dataset.recommendationUuid;
            if (uuid) shownRef.current.add(uuid);
            observerRef.current?.unobserve(entry.target);
          }
        },
        { threshold: 0.5 }
      );
    }
    observerRef.current.observe(el);
  }, []);

  const items = useMemo(() => {
    const network =
      total == null ? networkItems : networkItems.slice(0, Math.max(0, total - sparkloopItems.length));
    return blendPickerItems(network, sparkloopItems);
  }, [networkItems, sparkloopItems, total]);

  const toggle = useCallback((key) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    const picked = items.filter((item) => selected.has(item.key));
    if (!email || picked.length === 0) return;

    setSubmitState({ status: "submitting", subscribed: [], failed: [] });

    const networkPicks = picked.filter((item) => item.kind === "network");
    const sparkloopPicks = picked.filter((item) => item.kind === "sparkloop");

    const tasks = networkPicks.map((item) =>
      subscribeToNetworkBrand({
        executeUrl: item.executeUrl,
        brandId: item.brandId,
        email,
        sourceBrand,
      }).then(
        () => [{ item, ok: true }],
        () => [{ item, ok: false }]
      )
    );

    if (sparkloopPicks.length && clientRef.current) {
      const uuids = sparkloopPicks.map((item) => item.uuid);
      const shownUuids = [...new Set([...shownRef.current, ...uuids])];
      tasks.push(
        clientRef.current.recommendations.subscribe({ email, uuids, shownUuids }).then(
          () => sparkloopPicks.map((item) => ({ item, ok: true })),
          (err) => {
            console.warn("SparkLoop subscribe failed:", err?.error || err?.message || err);
            return sparkloopPicks.map((item) => ({ item, ok: false }));
          }
        )
      );
    }

    const results = (await Promise.all(tasks)).flat();
    const subscribed = results.filter((r) => r.ok).map((r) => r.item);
    const failed = results.filter((r) => !r.ok).map((r) => r.item);

    setSubmitState({
      status: failed.length && !subscribed.length ? "error" : "done",
      subscribed,
      failed,
    });
  }, [email, items, selected, sourceBrand]);

  return {
    items,
    loadState,
    selected,
    toggle,
    submit,
    submitState,
    observeRecommendation,
  };
}
