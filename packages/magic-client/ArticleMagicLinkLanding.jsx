"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { executeAction, isRealBrowser } from "./index.js";
import "./article-magic-link-toast.css";

/**
 * Article-page handler for magic-link redirects (?subscribed=true&email=…).
 * Shows a toast, updates local subscriber state, and POSTs to magic /execute.
 *
 * @param {{ brand: string; executeUrl: string; onLocalStateUpdated?: () => void }} props
 */
function ArticleMagicLinkLandingInner({ brand, executeUrl, onLocalStateUpdated }) {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;

    const isSubscribed = searchParams.get("subscribed") === "true";
    const encodedEmail = searchParams.get("email");
    if (!isSubscribed || !encodedEmail) return;

    started.current = true;
    setVisible(true);
    setMessage("Confirming your subscription...");

    try {
      localStorage.setItem(`subscribed_${brand}`, "true");
      localStorage.setItem(`email_${brand}`, encodedEmail);
      localStorage.setItem(`subscribed_at_${brand}`, new Date().toISOString());
    } catch {
      /* private mode / quota */
    }
    onLocalStateUpdated?.();

    if (!isRealBrowser()) return;

    executeAction({ brand, executeUrl }, searchParams, "subscribe")
      .then((data) => {
        if (data.success) {
          setMessage("Thank you for subscribing");
          window.setTimeout(() => setVisible(false), 5000);
        } else {
          setMessage("Something went wrong confirming your subscription.");
        }
      })
      .catch(() => {
        setMessage("Something went wrong confirming your subscription.");
      });
  }, [searchParams, brand, executeUrl, onLocalStateUpdated]);

  if (!visible) return null;

  return (
    <div className="magic-article-subscribe-toast" role="status" aria-live="polite">
      <p className="magic-article-subscribe-toast-text">{message}</p>
    </div>
  );
}

export default function ArticleMagicLinkLanding(props) {
  return (
    <Suspense fallback={null}>
      <ArticleMagicLinkLandingInner {...props} />
    </Suspense>
  );
}
