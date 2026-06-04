"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { decodeEmailParam, stripSearchParams } from "./email-url.js";
import {
  getReaderToken,
  isRealBrowser,
  storeReaderTokenFromResponse,
} from "./index.js";

const inflight = new Set();

/**
 * Bootstrap readerToken + subscriber local state from CIO/newsletter ?email= landings.
 * Strips email (and userID) from the URL when subscribed; leaves params for subscribe forms otherwise.
 *
 * @param {{ brand: string; apiOrigin: string; onLocalStateUpdated?: () => void }} props
 */
function EmailClickSessionInner({ brand, apiOrigin, onLocalStateUpdated }) {
  const searchParams = useSearchParams();
  const startedKey = useRef(null);

  useEffect(() => {
    const encodedEmail = searchParams.get("email");
    if (!encodedEmail) return;

    const email = decodeEmailParam(encodedEmail);
    if (!email) return;

    const dedupeKey = `${brand}:${email.toLowerCase()}`;
    if (startedKey.current === dedupeKey) return;
    startedKey.current = dedupeKey;

    if (getReaderToken()) {
      stripSearchParams(["email", "userID"]);
      return;
    }

    if (inflight.has(dedupeKey)) return;
    if (!isRealBrowser()) return;

    const userID = searchParams.get("userID")?.trim() || null;
    const base = (apiOrigin || "").replace(/\/$/, "");
    if (!base) return;

    inflight.add(dedupeKey);

    fetch(`${base}/api/reader-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, brand, userID }),
      credentials: "omit",
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.subscribed && data?.readerToken) {
          storeReaderTokenFromResponse(data);
          try {
            localStorage.setItem(`subscribed_${brand}`, "true");
            localStorage.setItem(`email_${brand}`, encodedEmail);
            if (!localStorage.getItem(`subscribed_at_${brand}`)) {
              localStorage.setItem(`subscribed_at_${brand}`, new Date().toISOString());
            }
          } catch {
            /* private mode */
          }
          window.dispatchEvent(new CustomEvent("magic-subscriber-updated"));
          onLocalStateUpdated?.();
          stripSearchParams(["email", "userID"]);
        }
      })
      .catch(() => {
        /* leave email in URL for subscribe autofill */
      })
      .finally(() => {
        inflight.delete(dedupeKey);
      });
  }, [searchParams, brand, apiOrigin, onLocalStateUpdated]);

  return null;
}

export default function EmailClickSession(props) {
  return (
    <Suspense fallback={null}>
      <EmailClickSessionInner {...props} />
    </Suspense>
  );
}
