"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadSparkloopClient } from "./loader.js";

/**
 * One SparkLoop recommendation for an ad slot. Generates at most once per mount, and only
 * after `enabled` turns true (i.e. the slot is about to be seen), so every generated
 * recommendation is shown.
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
        const recs = await client.recommendations.generate({ limit: 1 });
        return Array.isArray(recs) && recs[0]?.uuid ? recs[0] : null;
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
      return client.recommendations.subscribe({ email, uuids: [uuid], shownUuids: [uuid] });
    },
    [state.rec]
  );

  return { status: state.status, rec: state.rec, subscribe };
}
