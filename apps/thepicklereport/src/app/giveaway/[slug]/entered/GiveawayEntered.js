"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BRAND, executeAction, isRealBrowser } from "@/lib/subscription";
import { useSubscriber } from "@/context/SubscriberContext";
import { getReaderToken } from "@/lib/reader-profile";
import { callGiveawayApi, daysUntilCopy } from "@/lib/giveaway-api";
import { readGiveawayRef } from "@/lib/giveaway-ref";
import { daysUntilDraw, giveawayStatus } from "@/config/giveaways";
import { siteConfig } from "@/config/site";
import styles from "../GiveawayLanding.module.css";

function asCount(value) {
  if (value == null) return 0;
  if (typeof value === "object" && value !== null && "value" in value) {
    return Number(value.value) || 0;
  }
  return Number(value) || 0;
}

/**
 * @param {{ giveaway: import("@/config/giveaways").GiveawayConfig }} props
 */
export default function GiveawayEntered({ giveaway }) {
  const searchParams = useSearchParams();
  const { refresh } = useSubscriber();
  const [status, setStatus] = useState("working");
  const [message, setMessage] = useState("Entering…");
  const [shareUrl, setShareUrl] = useState(null);
  const [credited, setCredited] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [copied, setCopied] = useState(false);
  /** true = was already a subscriber before this enter flow */
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  const days = daysUntilDraw(giveaway);
  const ended = giveawayStatus(giveaway) === "ended";

  useEffect(() => {
    let cancelled = false;

    function markLocalSubscriber(email) {
      if (!email) return;
      localStorage.setItem(`subscribed_${BRAND}`, "true");
      localStorage.setItem(`email_${BRAND}`, email);
      if (!localStorage.getItem(`subscribed_at_${BRAND}`)) {
        localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
      }
      refresh();
    }

    function applyStats(stats) {
      const referral = (stats.codes || []).find((c) => c.type === "referral");
      const entry = (stats.entries || []).find((e) => e.giveawaySlug === giveaway.slug);
      if (referral?.code) {
        const origin =
          (typeof window !== "undefined" && window.location.origin) ||
          siteConfig.siteUrl.replace(/\/$/, "");
        setShareUrl(
          `${origin}/giveaway/${giveaway.slug}?ref=${encodeURIComponent(referral.code)}`,
        );
        setCredited(asCount(referral.creditedSubs));
      }
      if (entry) {
        setTickets(asCount(entry.baseTickets) + asCount(entry.bonusTickets));
      }
    }

    async function loadStats() {
      const stats = await callGiveawayApi(
        {
          action: "stats",
          brand: siteConfig.brandId,
          giveawaySlug: giveaway.slug,
        },
        { bearer: true },
      );
      if (!cancelled) applyStats(stats);
    }

    /**
     * Instant enter for unsigned email form (no confirm link).
     * Magic subscribe_and_enter forces subscription (avoids EO catch-all trap) + entry.
     */
    async function enterFromEmail(emailParam, ref) {
      const data = await callGiveawayApi({
        action: "subscribe_and_enter",
        email: emailParam,
        brand: siteConfig.brandId,
        giveawaySlug: giveaway.slug,
        ref: ref || undefined,
        source: "entered_page_email",
      });
      if (!cancelled) {
        setAlreadySubscribed(Boolean(data.alreadySubscribed));
      }
      markLocalSubscriber(data.email || emailParam);
      applyStats(data);
    }

    async function run() {
      const token = searchParams.get("token");
      const emailParam = searchParams.get("email");
      const ref = readGiveawayRef(giveaway.slug, searchParams.get("ref")) || undefined;
      const already = searchParams.get("entered") === "1";

      try {
        if (token) {
          const redeemed = await callGiveawayApi({ action: "redeem", token });
          if (cancelled) return;
          if (redeemed.email) {
            markLocalSubscriber(redeemed.email);
          }

          if (redeemed.needsSubscribe && redeemed.email && isRealBrowser()) {
            setAlreadySubscribed(false);
            const params = new URLSearchParams();
            params.set("email", redeemed.email);
            params.set("utm_source", "giveaway");
            params.set("utm_campaign", giveaway.slug);
            if (ref) params.set("utm_content", ref);
            const sub = await executeAction(params, "subscribe");
            if (!sub?.success) {
              setStatus("error");
              setMessage("We couldn’t confirm your subscription. Try again.");
              return;
            }
          } else {
            setAlreadySubscribed(true);
          }

          if (!redeemed.entered) {
            await callGiveawayApi(
              {
                action: "enter",
                brand: siteConfig.brandId,
                giveawaySlug: giveaway.slug,
                ref,
                source: "entered_page",
              },
              { bearer: true },
            );
          }
          if (cancelled) return;
          await loadStats();
        } else if (emailParam && isRealBrowser() && !already) {
          await enterFromEmail(emailParam, ref);
        } else if (!getReaderToken() && !already) {
          setStatus("error");
          setMessage(
            "Open the link from your email, or enter from the giveaway page while signed in.",
          );
          return;
        } else if (!already) {
          setAlreadySubscribed(true);
          await callGiveawayApi(
            {
              action: "enter",
              brand: siteConfig.brandId,
              giveawaySlug: giveaway.slug,
              ref,
              source: "entered_page_session",
            },
            { bearer: true },
          );
          if (cancelled) return;
          await loadStats();
        } else {
          setAlreadySubscribed(true);
          await loadStats();
        }

        if (cancelled) return;

        setStatus("success");
        setMessage(
          ended
            ? "This draw has closed. Thanks for playing."
            : giveaway.successHeadline || "You’re entered in the draw!",
        );
      } catch (err) {
        console.error("[giveaway entered]", err);
        if (!cancelled) {
          setStatus("error");
          const detail =
            err?.data?.action === "subscribe_required"
              ? "Subscribe to The Pickle Report first, then enter the draw."
              : "Something went wrong entering you in the draw. Please try again.";
          setMessage(detail);
        }
      }
    }

    run();

    function onFocus() {
      if (cancelled || !getReaderToken()) return;
      loadStats().catch(() => {});
    }
    function onVisibility() {
      if (document.visibilityState === "visible") onFocus();
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per landing params
  }, [searchParams]);

  async function copyShare() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const successBody = alreadySubscribed
    ? giveaway.successBodyExisting ||
      "You’re entered for a year’s worth of McClure’s Pickles."
    : giveaway.successBodyNew ||
      "Thanks for subscribing — you’ve been entered for a year’s worth of McClure’s Pickles.";

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.headline}>
          {status === "working" && <>Entering you in the draw…</>}
          {status === "success" && <>{message}</>}
          {status === "error" && <>Something went wrong</>}
        </h1>
        {status === "success" && !ended && days != null ? (
          <p className={styles.statusNote}>{daysUntilCopy(days)}</p>
        ) : null}
      </header>

      <div className={styles.prose}>
        {status === "working" && <p>Please wait just a moment.</p>}

        {status === "success" && !ended && (
          <>
            <p>{successBody}</p>
            {tickets != null && (
              <p>
                You have {tickets} ticket{tickets === 1 ? "" : "s"}.
              </p>
            )}
            {shareUrl && (
              <>
                <h2>Get more tickets</h2>
                <p>
                  Share your link — each friend who subscribes through it adds another
                  ticket.
                  {credited != null ? ` Friends subscribed so far: ${credited}.` : ""}
                </p>
                <p className={styles.shareUrl}>{shareUrl}</p>
                <div className={styles.enterBlock}>
                  <button
                    type="button"
                    className="button button-primary"
                    onClick={copyShare}
                  >
                    {copied ? "Copied" : "Copy share link"}
                  </button>
                  <Link className={styles.textLink} href={`/giveaway/${giveaway.slug}`}>
                    Back to giveaway
                  </Link>
                </div>
              </>
            )}
          </>
        )}

        {status === "success" && ended && <p>{message}</p>}

        {status === "error" && (
          <>
            <p>{message}</p>
            <p className={styles.nextLink}>
              <Link href={`/giveaway/${giveaway.slug}`}>Back to giveaway</Link>
            </p>
          </>
        )}
      </div>
    </article>
  );
}
