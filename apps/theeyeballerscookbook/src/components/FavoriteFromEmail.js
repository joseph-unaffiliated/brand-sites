"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getReaderToken } from "@publication-websites/magic-client";
import { stripSearchParams } from "@publication-websites/magic-client/email-url";
import ArticleMagicLinkLanding from "@publication-websites/magic-client/article-magic-link";
import { trackFavoriteAdd } from "@publication-websites/reader-events";
import { addFavorite } from "@/lib/favorites";
import { useSubscriber } from "@/context/SubscriberContext";
import { BRAND, siteConfig } from "@/config/site";
import "@publication-websites/magic-client/article-magic-link-toast.css";

const TOKEN_WAIT_MS = 8000;

/**
 * Email deep-link: /favorites?add={slug} (optionally with magic ?subscribed=true&email=…).
 * Adds the recipe locally + syncs to reader profile once subscribed/token is ready.
 */
function FavoriteFromEmailInner() {
  const searchParams = useSearchParams();
  const { isSubscribed, refresh } = useSubscriber();
  const [toast, setToast] = useState("");
  const started = useRef(false);

  useEffect(() => {
    const slug = searchParams.get("add")?.trim();
    if (!slug || started.current) return;

    const fromMagic = searchParams.get("subscribed") === "true";
    if (!isSubscribed && !fromMagic) return;

    started.current = true;

    if (fromMagic) {
      const encodedEmail = searchParams.get("email");
      if (encodedEmail) {
        try {
          localStorage.setItem(`subscribed_${BRAND}`, "true");
          localStorage.setItem(`email_${BRAND}`, encodedEmail);
          if (!localStorage.getItem(`subscribed_at_${BRAND}`)) {
            localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
          }
        } catch {
          /* ignore */
        }
      }
      refresh();
    }

    let cancelled = false;
    const startedAt = Date.now();
    let tokenListener = null;

    const finish = (withSync) => {
      if (cancelled) return;
      addFavorite(slug);
      // If we saved before the reader token existed, retry sync when it arrives.
      if (!withSync) {
        tokenListener = () => {
          trackFavoriteAdd(slug);
          window.removeEventListener("magic-reader-token-updated", tokenListener);
        };
        window.addEventListener("magic-reader-token-updated", tokenListener);
      }
      setToast("Saved to your favorites");
      stripSearchParams(["add", "subscribed"]);
      window.setTimeout(() => {
        if (!cancelled) setToast("");
      }, 4000);
    };

    const tryAdd = () => {
      if (cancelled) return;
      if (getReaderToken()) {
        finish(true);
        return;
      }
      if (Date.now() - startedAt >= TOKEN_WAIT_MS) {
        finish(false);
        return;
      }
      window.setTimeout(tryAdd, 250);
    };

    tryAdd();

    return () => {
      cancelled = true;
      if (tokenListener) {
        window.removeEventListener("magic-reader-token-updated", tokenListener);
      }
    };
  }, [searchParams, isSubscribed, refresh]);

  if (!toast) return null;

  return (
    <div className="magic-article-subscribe-toast-anchor" aria-hidden="false">
      <div className="magic-article-subscribe-toast" role="status" aria-live="polite">
        <p className="magic-article-subscribe-toast-text">{toast}</p>
      </div>
    </div>
  );
}

/** Subscribe confirmation (magic) + favorite-from-email deep link on /favorites. */
export default function FavoriteFromEmail() {
  const { refresh } = useSubscriber();

  return (
    <>
      <ArticleMagicLinkLanding
        brand={BRAND}
        executeUrl={siteConfig.magicExecuteUrl}
        onLocalStateUpdated={refresh}
      />
      <Suspense fallback={null}>
        <FavoriteFromEmailInner />
      </Suspense>
    </>
  );
}
