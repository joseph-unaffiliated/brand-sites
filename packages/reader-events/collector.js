/**
 * Batch reader events to magic POST /api/reader-events.
 */

import { getReaderToken } from "@publication-websites/magic-client";
import { hasAnalyticsConsent } from "./consent.js";
import {
  isPreferenceEventType,
  isReaderEventsEnabled,
  isSessionOnlyEventType,
} from "./constants.js";

let config = {
  brandId: "",
  apiOrigin: "",
};

let queue = [];
let flushTimer = null;
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE = 50;

export function initReaderEventsCollector({ brandId, apiOrigin }) {
  if (!isReaderEventsEnabled()) return;
  config = { brandId, apiOrigin: (apiOrigin || "").replace(/\/$/, "") };
  if (typeof window === "undefined") return;

  const onHidden = () => {
    if (document.visibilityState === "hidden") flush(true);
  };
  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("pagehide", () => flush(true));
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem("reader_session_id");
    if (!id) {
      id = `sess_${crypto.randomUUID()}`;
      sessionStorage.setItem("reader_session_id", id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

export function enqueueEvent(eventType, properties = {}) {
  if (!isReaderEventsEnabled()) return;

  const preference = isPreferenceEventType(eventType);
  if (!preference && !hasAnalyticsConsent()) return;

  const sessionOnly = isSessionOnlyEventType(eventType);
  if (!sessionOnly && !getReaderToken()) return;

  const { articleSlug, ...restProps } = properties;

  queue.push({
    eventID: crypto.randomUUID(),
    eventType,
    brand: config.brandId,
    articleSlug: articleSlug || null,
    url: typeof window !== "undefined" ? window.location.href : "",
    referrer: typeof document !== "undefined" ? document.referrer || "" : "",
    sessionID: getSessionId(),
    clientTimestamp: new Date().toISOString(),
    properties: Object.keys(restProps).length ? restProps : null,
  });

  if (preference || queue.length >= MAX_QUEUE) {
    flush(false);
    return;
  }
  if (!flushTimer) {
    flushTimer = setTimeout(() => flush(false), FLUSH_INTERVAL_MS);
  }
}

function postEvents(events, token, useBeacon) {
  const url = `${config.apiOrigin}/api/reader-events`;
  const body = JSON.stringify({ readerToken: token || undefined, events });

  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  fetch(url, {
    method: "POST",
    headers,
    body,
    credentials: "omit",
    keepalive: useBeacon,
  }).catch(() => {
    /* best effort */
  });
}

export function flush(useBeacon = false) {
  if (!isReaderEventsEnabled() || !config.apiOrigin) return;
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (!queue.length) return;

  const batch = queue.splice(0, MAX_QUEUE);
  const token = getReaderToken();

  const sessionEvents = batch.filter((ev) => isSessionOnlyEventType(ev.eventType));
  const identifiedEvents = batch.filter((ev) => !isSessionOnlyEventType(ev.eventType));

  if (sessionEvents.length) {
    postEvents(sessionEvents, null, useBeacon);
  }

  if (identifiedEvents.length) {
    if (token) {
      postEvents(identifiedEvents, token, useBeacon);
    } else {
      queue.unshift(...identifiedEvents);
    }
  }
}
