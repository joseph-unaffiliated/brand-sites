"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSubscriber } from "@/context/SubscriberContext";
import { getReaderToken } from "@/lib/reader-profile";
import { callGiveawayApi, daysUntilCopy } from "@/lib/giveaway-api";
import {
  daysUntilDraw,
  getCurrentOrUpcoming,
  giveawayStatus,
} from "@/config/giveaways";
import { siteConfig } from "@/config/site";
import actions from "@/components/SubscriptionPageActions.module.css";
import styles from "../../subscribed/page.module.css";

/**
 * @param {{ giveaway: import("@/config/giveaways").GiveawayConfig }} props
 */
export default function GiveawayLanding({ giveaway }) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") || "";
  const { isSubscribed, refresh } = useSubscriber();
  const status = giveawayStatus(giveaway);
  const days = daysUntilDraw(giveaway);
  const next = useMemo(() => {
    if (status !== "ended") return null;
    const other = getCurrentOrUpcoming();
    return other && other.slug !== giveaway.slug ? other : null;
  }, [status, giveaway.slug]);

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const signedIn = isSubscribed || !!getReaderToken();

  async function enterSignedIn() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await callGiveawayApi(
        {
          action: "enter",
          brand: siteConfig.brandId,
          giveawaySlug: giveaway.slug,
          ref: ref || undefined,
          source: "landing_signed_in",
        },
        { bearer: true },
      );
      refresh();
      const q = new URLSearchParams();
      if (ref) q.set("ref", ref);
      q.set("entered", "1");
      window.location.href = `/giveaway/${giveaway.slug}/entered?${q.toString()}`;
    } catch (e) {
      if (e?.data?.action === "subscribe_required") {
        setError("Subscribe first, then enter the draw.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      setBusy(false);
    }
  }

  async function submitEmail(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await callGiveawayApi({
        action: "start",
        email: value,
        brand: siteConfig.brandId,
        giveawaySlug: giveaway.slug,
        ref: ref || undefined,
        prizeHeadline: giveaway.prizeHeadline,
        drawAt: giveaway.drawAt,
      });
      if (data.action === "confirm_email_sent") {
        setNotice("Check your email to confirm and enter the draw.");
      } else if (data.action === "enter_link_sent") {
        setNotice("Check your email for your link to enter the draw.");
      } else {
        setNotice("Check your email to continue.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={`${styles.card} ${actions.cardWide}`}>
        <h1 className={styles.heading}>{giveaway.prizeHeadline}</h1>
        <p className={styles.body}>{giveaway.prizeBody}</p>

        {status === "live" && (
          <p className={styles.body}>{daysUntilCopy(days)}</p>
        )}
        {status === "scheduled" && (
          <p className={styles.body}>This giveaway has not started yet.</p>
        )}
        {status === "ended" && (
          <p className={styles.body}>This draw has closed.</p>
        )}

        {giveaway.rulesText ? (
          <p className={styles.body}>{giveaway.rulesText}</p>
        ) : null}

        {status === "live" && signedIn && (
          <div className={actions.actionRow}>
            <button
              type="button"
              className={actions.btnPrimary}
              disabled={busy}
              onClick={enterSignedIn}
            >
              {busy ? "…" : giveaway.ctaEnterLabel || "Enter the draw"}
            </button>
          </div>
        )}

        {status === "live" && !signedIn && (
          <form
            onSubmit={submitEmail}
            style={{ marginTop: "1.75rem", maxWidth: "28rem", marginInline: "auto" }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              disabled={busy}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "0.75rem 1rem",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                fontSize: "1rem",
                marginBottom: "0.75rem",
              }}
            />
            <div className={actions.actionRow} style={{ marginTop: 0 }}>
              <button type="submit" className={actions.btnPrimary} disabled={busy}>
                {busy ? "…" : giveaway.ctaSubscribeLabel || "Enter the draw + subscribe"}
              </button>
            </div>
          </form>
        )}

        {notice && <p className={styles.body}>{notice}</p>}
        {error && <p className={styles.body}>{error}</p>}

        {next && (
          <div className={actions.actionRow}>
            <Link className={actions.btn} href={`/giveaway/${next.slug}`}>
              See {next.title}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
