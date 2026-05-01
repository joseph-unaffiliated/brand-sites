"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BRAND, executeAction, isRealBrowser } from "@/lib/subscription";
import { useSubscriber } from "@/context/SubscriberContext";
import actions from "@/components/SubscriptionPageActions.module.css";
import styles from "../subscribed/page.module.css";
import extra from "./page.module.css";

/** @param {string | null} encoded */
function decodeBase64Url(encoded) {
  if (!encoded || typeof encoded !== "string") return null;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const decoded = decodeURIComponent(atob(padded));
    const u = new URL(decoded);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return decoded;
  } catch {
    return null;
  }
}

/** @param {string} decodedUrl @param {string | null} sitename */
function destinationLabel(decodedUrl, sitename) {
  const s = sitename?.trim();
  if (s) return s;
  try {
    return new URL(decodedUrl).hostname.replace(/^www\./, "");
  } catch {
    return "the next page";
  }
}

function RedirectContent() {
  const searchParams = useSearchParams();
  const { refresh } = useSubscriber();
  const encodedUrl = searchParams.get("url");
  const sitename = searchParams.get("sitename");
  const encodedEmail = searchParams.get("email");

  const decodedUrl = useMemo(
    () => (encodedUrl ? decodeBase64Url(encodedUrl) : null),
    [encodedUrl],
  );
  const label = useMemo(
    () => (decodedUrl ? destinationLabel(decodedUrl, sitename) : ""),
    [decodedUrl, sitename],
  );

  const [phase, setPhase] = useState("pending");
  const [retryKey, setRetryKey] = useState(0);
  const redirectTimerRef = useRef(null);

  useEffect(() => {
    if (!encodedUrl) {
      setPhase("no-url");
      return;
    }
    if (!decodedUrl) {
      setPhase("bad-url");
      return;
    }

    let cancelled = false;

    async function run() {
      setPhase("working");

      if (encodedEmail) {
        localStorage.setItem(`subscribed_${BRAND}`, "true");
        localStorage.setItem(`email_${BRAND}`, encodedEmail);
        localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
        refresh();

        if (typeof gtag !== "undefined") {
          gtag("event", "conversion", { send_to: "AW-17856709988/yAjBCImA9tObP05K38JC" });
          gtag("event", "subscription_success", {
            event_category: "engagement",
            event_label: "magic_redirect_external",
          });
        }
        if (typeof fbq !== "undefined") {
          fbq("track", "Lead");
        }

        if (!isRealBrowser()) {
          if (!cancelled) setPhase("bot");
          return;
        }

        try {
          const data = await executeAction(searchParams, "subscribe");
          if (cancelled) return;
          if (data?.success) setPhase("ready");
          else setPhase("exec-error");
        } catch {
          if (!cancelled) setPhase("exec-error");
        }
      } else if (!cancelled) {
        setPhase("ready");
      }
    }

    run();

    return () => {
      cancelled = true;
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [retryKey, searchParams, encodedUrl, decodedUrl, encodedEmail, refresh]);

  useEffect(() => {
    if (phase !== "ready" || !decodedUrl) return;
    redirectTimerRef.current = window.setTimeout(() => {
      window.location.href = decodedUrl;
    }, 2000);
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [phase, decodedUrl]);

  function retrySubscribe() {
    setPhase("pending");
    setRetryKey((k) => k + 1);
  }

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={`${styles.card} ${actions.cardWide}`}>
        <h1 className={styles.heading}>
          {phase === "no-url" && <>We couldn&apos;t find a redirect link.</>}
          {phase === "bad-url" && <>That redirect link doesn&apos;t look valid.</>}
          {(phase === "pending" || phase === "working") && (
            <>
              {encodedEmail ? (
                <>Thank you for subscribing.</>
              ) : (
                <>One moment&hellip;</>
              )}
            </>
          )}
          {phase === "ready" && (
            <>
              {encodedEmail ? (
                <>Thank you for subscribing.</>
              ) : (
                <>You&apos;re being redirected.</>
              )}
            </>
          )}
          {phase === "exec-error" && <>Something went wrong confirming your subscription.</>}
          {phase === "bot" && <>One more step</>}
        </h1>

        {(phase === "pending" || phase === "working") && (
          <p className={styles.body}>
            {encodedEmail
              ? "Please wait—we are saving your subscription and preparing the next page."
              : "Preparing the next page."}
          </p>
        )}

        {phase === "ready" && decodedUrl && (
          <>
            <p className={styles.body}>
              You are now being redirected to <strong>{label}</strong>.
            </p>
            <p className={styles.body}>
              <a href={decodedUrl} className={extra.fallbackLink}>
                Continue if you are not redirected automatically
              </a>
            </p>
          </>
        )}

        {phase === "no-url" && (
          <p className={styles.body}>
            This page needs a valid <code>url</code> query parameter (base64-encoded destination).
          </p>
        )}
        {phase === "bad-url" && (
          <p className={styles.body}>
            The link may be corrupted or expired. Please use the link from your email again.
          </p>
        )}

        {phase === "exec-error" && (
          <div className={styles.errorTryAgain}>
            <button type="button" className={actions.btn} onClick={retrySubscribe}>
              Try again
            </button>
          </div>
        )}

        {phase === "bot" && (
          <>
            <p className={styles.body}>
              We couldn&apos;t confirm you automatically. Use the button below to try again.
            </p>
            <div className={styles.errorTryAgain}>
              <button type="button" className={actions.btn} onClick={retrySubscribe}>
                Try again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectContent />
    </Suspense>
  );
}
