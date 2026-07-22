"use client";

import { useEffect, useRef } from "react";
import {
  ensureUserId,
  getReaderToken,
  getUserId,
} from "@publication-websites/magic-client";
import {
  ANALYTICS_CONSENT_EVENT,
  hasAnalyticsConsent,
  subscribeAnalyticsConsent,
} from "./consent.js";

const POSTED_SESSION_PREFIX = "ga_client_id_posted_";

function getMeasurementId() {
  return (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim();
}

/**
 * @param {string} measurementId
 * @param {string} userID
 */
function setGaUserId(measurementId, userID) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("set", { user_id: userID });
  window.gtag("config", measurementId, { user_id: userID });
}

/**
 * @param {string} measurementId
 * @returns {Promise<string | null>}
 */
function getGaClientId(measurementId) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") {
      resolve(null);
      return;
    }
    let settled = false;
    const done = (id) => {
      if (settled) return;
      settled = true;
      resolve(typeof id === "string" && id ? id : null);
    };
    try {
      window.gtag("get", measurementId, "client_id", done);
    } catch {
      done(null);
      return;
    }
    window.setTimeout(() => done(null), 2000);
  });
}

/**
 * Set GA user_id when known + consent; POST client_id → magic for BQ stitching.
 * Runs even when reader-events ingest is disabled.
 */
export default function GaIdentityBridge({ brandId, apiOrigin }) {
  const inFlight = useRef(false);

  useEffect(() => {
    const origin = (apiOrigin || "").replace(/\/$/, "");
    const brand = brandId || "";
    if (!origin || !brand) return undefined;

    const consentCleanup = subscribeAnalyticsConsent();

    const run = async () => {
      if (inFlight.current) return;
      if (!hasAnalyticsConsent()) return;

      const measurementId = getMeasurementId();
      if (!measurementId) return;
      if (!getReaderToken()) return;

      inFlight.current = true;
      try {
        const userID = (await ensureUserId(origin)) || getUserId();
        if (!userID) return;

        setGaUserId(measurementId, userID);

        const clientId = await getGaClientId(measurementId);
        if (!clientId) return;

        const dedupeKey = `${POSTED_SESSION_PREFIX}${userID}_${clientId}`;
        try {
          if (sessionStorage.getItem(dedupeKey)) return;
        } catch {
          /* continue */
        }

        const token = getReaderToken();
        if (!token) return;

        const res = await fetch(`${origin}/api/ga-client-id`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userID, clientId, brand }),
        });
        if (res.ok) {
          try {
            sessionStorage.setItem(dedupeKey, "1");
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      } finally {
        inFlight.current = false;
      }
    };

    run();
    const onReady = () => {
      void run();
    };
    window.addEventListener("magic-reader-token-updated", onReady);
    window.addEventListener("magic-user-id-updated", onReady);
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onReady);

    return () => {
      consentCleanup();
      window.removeEventListener("magic-reader-token-updated", onReady);
      window.removeEventListener("magic-user-id-updated", onReady);
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onReady);
    };
  }, [brandId, apiOrigin]);

  return null;
}
