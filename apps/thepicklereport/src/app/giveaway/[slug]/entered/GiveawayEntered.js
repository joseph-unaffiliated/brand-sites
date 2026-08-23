"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BRAND, executeAction, isRealBrowser } from "@/lib/subscription";
import { useSubscriber } from "@/context/SubscriberContext";
import { getReaderToken } from "@/lib/reader-profile";
import { callGiveawayApi, daysUntilCopy } from "@/lib/giveaway-api";
import { daysUntilDraw, giveawayStatus } from "@/config/giveaways";
import { siteConfig } from "@/config/site";
import actions from "@/components/SubscriptionPageActions.module.css";
import styles from "../../../subscribed/page.module.css";

/**
 * @param {{ giveaway: import("@/config/giveaways").GiveawayConfig }} props
 */
export default function GiveawayEntered({ giveaway }) {
  const searchParams = useSearchParams();
  const { refresh } = useSubscriber();
  const [status, setStatus] = useState("working");
  const [message, setMessage] = useState("Confirming…");
  const [shareUrl, setShareUrl] = useState(null);
  const [credited, setCredited] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [copied, setCopied] = useState(false);

  const days = daysUntilDraw(giveaway);
  const ended = giveawayStatus(giveaway) === "ended";

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const token = searchParams.get("token");
      const emailParam = searchParams.get("email");
      const ref = searchParams.get("ref") || undefined;
      const already = searchParams.get("entered") === "1";

      try {
        if (token) {
          const redeemed = await callGiveawayApi({ action: "redeem", token });
          if (cancelled) return;
          if (redeemed.email) {
            localStorage.setItem(`subscribed_${BRAND}`, "true");
            localStorage.setItem(`email_${BRAND}`, redeemed.email);
            if (!localStorage.getItem(`subscribed_at_${BRAND}`)) {
              localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
            }
            refresh();
          }

          if (redeemed.needsSubscribe && redeemed.email && isRealBrowser()) {
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
        } else if (emailParam && isRealBrowser() && !already) {
          localStorage.setItem(`subscribed_${BRAND}`, "true");
          localStorage.setItem(`email_${BRAND}`, emailParam);
          if (!localStorage.getItem(`subscribed_at_${BRAND}`)) {
            localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
          }
          refresh();
          const params = new URLSearchParams(searchParams.toString());
          params.set("utm_source", params.get("utm_source") || "giveaway");
          params.set("utm_campaign", params.get("utm_campaign") || giveaway.slug);
          await executeAction(params, "subscribe");
          await callGiveawayApi(
            {
              action: "enter",
              brand: siteConfig.brandId,
              giveawaySlug: giveaway.slug,
              ref,
              source: "entered_page_email",
            },
            { bearer: true },
          );
        } else if (!getReaderToken() && !already) {
          setStatus("error");
          setMessage(
            "Open the link from your email, or enter from the giveaway page while signed in.",
          );
          return;
        } else if (!already) {
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
        }

        if (cancelled) return;

        const stats = await callGiveawayApi(
          {
            action: "stats",
            brand: siteConfig.brandId,
            giveawaySlug: giveaway.slug,
          },
          { bearer: true },
        );

        const referral = (stats.codes || []).find((c) => c.type === "referral");
        const entry = (stats.entries || []).find((e) => e.giveawaySlug === giveaway.slug);
        if (referral?.code) {
          const origin = siteConfig.siteUrl.replace(/\/$/, "");
          setShareUrl(
            `${origin}/giveaway/${giveaway.slug}?ref=${encodeURIComponent(referral.code)}`,
          );
          setCredited(Number(referral.creditedSubs) || 0);
        }
        if (entry) {
          setTickets(
            (Number(entry.baseTickets) || 0) + (Number(entry.bonusTickets) || 0),
          );
        }

        setStatus("success");
        setMessage(
          ended
            ? "This draw has closed. Thanks for playing."
            : giveaway.successHeadline || "You’re entered in the draw!",
        );
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Something went wrong confirming your entry.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
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

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={`${styles.card} ${actions.cardWide}`}>
        <h1 className={styles.heading}>
          {status === "working" && <>Confirming your entry…</>}
          {status === "success" && <>{message}</>}
          {status === "error" && <>Something went wrong</>}
        </h1>

        {status === "working" && (
          <p className={styles.body}>Please wait just a moment.</p>
        )}

        {status === "success" && !ended && (
          <>
            <p className={styles.body}>
              {giveaway.successBodyNew ||
                giveaway.successBodyExisting ||
                giveaway.prizeBody}
            </p>
            <p className={styles.body}>{daysUntilCopy(days)}</p>
            {tickets != null && (
              <p className={styles.body}>
                You have {tickets} ticket{tickets === 1 ? "" : "s"}.
              </p>
            )}
            {shareUrl && (
              <>
                <p className={styles.body}>
                  Share your link — each friend who subscribes through it adds another
                  ticket.
                  {credited != null ? ` Friends subscribed so far: ${credited}.` : ""}
                </p>
                <p className={styles.body} style={{ wordBreak: "break-all" }}>
                  {shareUrl}
                </p>
                <div className={actions.actionRow}>
                  <button type="button" className={actions.btnPrimary} onClick={copyShare}>
                    {copied ? "Copied" : "Copy share link"}
                  </button>
                  <Link className={actions.btn} href={`/giveaway/${giveaway.slug}`}>
                    Back to giveaway
                  </Link>
                </div>
              </>
            )}
          </>
        )}

        {status === "success" && ended && (
          <p className={styles.body}>{message}</p>
        )}

        {status === "error" && (
          <>
            <p className={styles.body}>{message}</p>
            <div className={actions.actionRow}>
              <Link className={actions.btn} href={`/giveaway/${giveaway.slug}`}>
                Back to giveaway
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
