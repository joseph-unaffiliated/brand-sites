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

/** Warehouse / CIO customer.id — ignore CIO cio_id (e0910c…). */
const WAREHOUSE_USER_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isWarehouseUserId(value) {
  return typeof value === "string" && WAREHOUSE_USER_ID_RE.test(value.trim());
}

/**
 * Bootstrap readerToken + subscriber local state from CIO landings.
 * Supports ?email= and/or warehouse ?userID= (UUID from {{customer.id}}).
 * Strips email/userID from the URL when subscribed; leaves params for subscribe forms otherwise.
 *
 * @param {{ brand: string; apiOrigin: string; onLocalStateUpdated?: () => void }} props
 */
function EmailClickSessionInner({ brand, apiOrigin, onLocalStateUpdated }) {
  const searchParams = useSearchParams();
  const startedKey = useRef(null);

  useEffect(() => {
    const encodedEmail = searchParams.get("email");
    const rawUserID = searchParams.get("userID")?.trim() || null;
    const email = encodedEmail ? decodeEmailParam(encodedEmail) : null;
    const userID = isWarehouseUserId(rawUserID) ? rawUserID.trim() : null;

    if (!email && !userID) return;

    const dedupeKey = `${brand}:${(email || "").toLowerCase()}:${userID || ""}`;
    if (startedKey.current === dedupeKey) return;
    startedKey.current = dedupeKey;

    if (getReaderToken()) {
      stripSearchParams(["email", "userID"]);
      return;
    }

    if (inflight.has(dedupeKey)) return;
    if (!isRealBrowser()) return;

    const base = (apiOrigin || "").replace(/\/$/, "");
    if (!base) return;

    inflight.add(dedupeKey);

    const body = { brand };
    if (email) body.email = email;
    if (userID) body.userID = userID;

    fetch(`${base}/api/reader-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
    })
      .then((res) => res.json().catch(() => ({})))
      .then((data) => {
        if (data?.subscribed && data?.readerToken) {
          storeReaderTokenFromResponse(data);
          try {
            localStorage.setItem(`subscribed_${brand}`, "true");
            const emailForStorage =
              encodedEmail ||
              (typeof data.email === "string" ? encodeURIComponent(data.email) : null);
            if (emailForStorage) {
              localStorage.setItem(`email_${brand}`, emailForStorage);
            }
            if (!localStorage.getItem(`subscribed_at_${brand}`)) {
              localStorage.setItem(`subscribed_at_${brand}`, new Date().toISOString());
            }
          } catch {
            /* private mode */
          }
          window.dispatchEvent(new CustomEvent("magic-subscriber-updated"));
          onLocalStateUpdated?.();
          // /subscribed (and siblings) need ?email= for executeAction; stripping
          // mid-confirm races the landing page into a no-email "thanks" state.
          const onSubscriptionLanding =
            typeof document !== "undefined" &&
            !!document.querySelector("[data-subscription-landing]");
          if (!onSubscriptionLanding) {
            stripSearchParams(["email", "userID"]);
          }
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
