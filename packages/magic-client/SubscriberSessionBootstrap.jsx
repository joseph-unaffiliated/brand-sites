"use client";

import { useEffect, useRef } from "react";
import { decodeEmailParam } from "./email-url.js";
import {
  getReaderToken,
  isRealBrowser,
  storeReaderTokenFromResponse,
} from "./index.js";

const inflight = new Set();

/**
 * Mint readerToken for returning subscribers who have localStorage state but no token
 * (e.g. subscribed before reader platform, or never completed /execute JSON handshake).
 *
 * @param {{ brand: string; apiOrigin: string; onLocalStateUpdated?: () => void }} props
 */
export default function SubscriberSessionBootstrap({ brand, apiOrigin, onLocalStateUpdated }) {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (getReaderToken()) return;
    if (!isRealBrowser()) return;

    let subscribed = false;
    let encodedEmail = null;
    try {
      subscribed = localStorage.getItem(`subscribed_${brand}`) === "true";
      encodedEmail = localStorage.getItem(`email_${brand}`);
    } catch {
      return;
    }

    if (!subscribed || !encodedEmail) return;

    const email = decodeEmailParam(encodedEmail);
    if (!email) return;

    const dedupeKey = `${brand}:${email.toLowerCase()}`;
    if (inflight.has(dedupeKey)) return;

    const base = (apiOrigin || "").replace(/\/$/, "");
    if (!base) return;

    started.current = true;
    inflight.add(dedupeKey);

    fetch(`${base}/api/reader-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, brand }),
      credentials: "omit",
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.subscribed && data?.readerToken) {
          storeReaderTokenFromResponse(data);
          window.dispatchEvent(new CustomEvent("magic-subscriber-updated"));
          onLocalStateUpdated?.();
        }
      })
      .catch(() => {
        /* best effort */
      })
      .finally(() => {
        inflight.delete(dedupeKey);
      });
  }, [brand, apiOrigin, onLocalStateUpdated]);

  return null;
}
