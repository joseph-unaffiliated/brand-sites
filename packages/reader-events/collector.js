/**
 * Batch reader events to magic POST /api/reader-events.
 */

import { getReaderToken } from "@publication-websites/magic-client";
import { hasAnalyticsConsent } from "./consent.js";
import {
  isAnonymousOkEventType,
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

function canSendWithoutToken(eventType) {
  return isSessionOnlyEventType(eventType) || isAnonymousOkEventType(eventType);
}

export function enqueueEvent(eventType, properties = {}) {
  if (!isReaderEventsEnabled()) return;

  const preference = isPreferenceEventType(eventType);
  if (!preference && !hasAnalyticsConsent()) return;

  if (!canSendWithoutToken(eventType) && !getReaderToken()) return;

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

  // Authenticated events: prefer fetch + keepalive. sendBeacon omits Authorization
  // and has been unreliable for cross-origin JSON (historically zero ad_clicks in BQ).
  if (token) {
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
      credentials: "omit",
      keepalive: true,
    }).catch(() => {
      /* best effort */
    });
    return;
  }

  if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    const ok = navigator.sendBeacon(url, blob);
    if (ok) return;
  }

  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    credentials: "omit",
    keepalive: true,
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

  const withoutToken = [];
  const withToken = [];
  const deferred = [];

  for (const ev of batch) {
    if (token && !isSessionOnlyEventType(ev.eventType)) {
      // Identified path (includes ad_* when logged in — needed for lead marking)
      withToken.push(ev);
    } else if (canSendWithoutToken(ev.eventType)) {
      withoutToken.push(ev);
    } else if (token) {
      withToken.push(ev);
    } else {
      deferred.push(ev);
    }
  }

  if (withoutToken.length) {
    postEvents(withoutToken, null, useBeacon);
  }
  if (withToken.length) {
    postEvents(withToken, token, useBeacon);
  }
  if (deferred.length) {
    queue.unshift(...deferred);
  }
}
