"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadSparkloopClient } from "./loader.js";

const BATCH_SIZE = 5;
const BATCH_TTL_MS = 30 * 60_000;

const batchKey = (publicationId) => `sparkloop_rec_batch_${publicationId}`;

function readBatch(key) {
  try {
    const batch = JSON.parse(window.sessionStorage.getItem(key) || "null");
    return batch && Array.isArray(batch.recs) ? batch : null;
  } catch {
    return null;
  }
}

function writeBatch(key, batch) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(batch));
  } catch {
    /* storage blocked — each page view just generates its own */
  }
}

/**
 * This page view's recommendation. SparkLoop always ranks its best earner first and can't
 * exclude ones already shown, so a visit generates a batch once and shows it one per page,
 * generating again only when the batch is used up or stale.
 */
async function nextRecommendation(client, publicationId) {
  const key = batchKey(publicationId);
  let batch = readBatch(key);
  if (!batch || Date.now() - batch.at > BATCH_TTL_MS || batch.next >= batch.recs.length) {
    const recs = await client.recommendations.generate({ limit: BATCH_SIZE });
    batch = {
      at: Date.now(),
      next: 0,
      recs: (Array.isArray(recs) ? recs : []).filter((r) => r?.uuid),
    };
  }
  const rec = batch.recs[batch.next] ?? null;
  writeBatch(key, { ...batch, next: batch.next + 1 });
  return rec;
}

/** Drop a recommendation the reader just subscribed to from the rest of the visit. */
function forgetRecommendation(publicationId, uuid) {
  const key = batchKey(publicationId);
  const batch = readBatch(key);
  if (!batch) return;
  const index = batch.recs.findIndex((r) => r.uuid === uuid);
  if (index < 0) return;
  writeBatch(key, {
    ...batch,
    recs: batch.recs.filter((_, i) => i !== index),
    next: index < batch.next ? batch.next - 1 : batch.next,
  });
}

/**
 * One SparkLoop recommendation for an ad slot, taken from the visit's batch (see
 * `nextRecommendation`). Resolves at most once per mount, and only after `enabled` turns true
 * (i.e. the slot is about to be seen).
 *
 * status: "idle" (waiting for enabled) | "loading" | "ready" | "empty" (nothing to show or error)
 *
 * @param {{ publicationId?: string, testMode?: boolean, enabled: boolean }} opts
 */
export function useSparkloopRecommendation({ publicationId, testMode = true, enabled }) {
  const [state, setState] = useState({ status: "idle", rec: null });
  const clientRef = useRef(null);
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || startedRef.current) return;
    startedRef.current = true;
    if (!publicationId) {
      setState({ status: "empty", rec: null });
      return;
    }
    setState({ status: "loading", rec: null });
    loadSparkloopClient({ publicationId, testMode })
      .then(async (client) => {
        clientRef.current = client;
        return nextRecommendation(client, publicationId);
      })
      .then((rec) => {
        if (!mountedRef.current) return;
        setState(rec ? { status: "ready", rec } : { status: "empty", rec: null });
      })
      .catch((err) => {
        console.warn("SparkLoop recommendation unavailable:", err?.message || err);
        if (mountedRef.current) setState({ status: "empty", rec: null });
      });
  }, [enabled, publicationId, testMode]);

  const subscribe = useCallback(
    async (email) => {
      const client = clientRef.current;
      const uuid = state.rec?.uuid;
      if (!client || !uuid || !email) throw new Error("SparkLoop recommendation not ready");
      const result = await client.recommendations.subscribe({
        email,
        uuids: [uuid],
        shownUuids: [uuid],
      });
      forgetRecommendation(publicationId, uuid);
      return result;
    },
    [state.rec, publicationId]
  );

  return { status: state.status, rec: state.rec, subscribe };
}
