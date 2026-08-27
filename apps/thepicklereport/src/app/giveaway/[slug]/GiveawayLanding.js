"use client";

import { useEffect, useMemo, useState } from "react";
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
import { readGiveawayRef } from "@/lib/giveaway-ref";
import styles from "./GiveawayLanding.module.css";

/**
 * @param {{ giveaway: import("@/config/giveaways").GiveawayConfig }} props
 */
export default function GiveawayLanding({ giveaway }) {
  const searchParams = useSearchParams();
  const urlRef = searchParams.get("ref");
  const [ref, setRef] = useState(() => (urlRef ? String(urlRef).toLowerCase().trim() : ""));
  const { isSubscribed, refresh } = useSubscriber();

  useEffect(() => {
    setRef(readGiveawayRef(giveaway.slug, urlRef));
  }, [giveaway.slug, urlRef]);
  const status = giveawayStatus(giveaway);
  const days = daysUntilDraw(giveaway);
  const next = useMemo(() => {
    if (status !== "ended") return null;
    const other = getCurrentOrUpcoming();
    return other && other.slug !== giveaway.slug ? other : null;
  }, [status, giveaway.slug]);

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const signedIn = isSubscribed || !!getReaderToken();
  const intro = giveaway.intro?.length ? giveaway.intro : [giveaway.prizeBody];
  const steps = giveaway.howToEnter || [];
  const stepsBeforeCta = steps.slice(0, 2);
  const stepsAfterCta = steps.slice(2);
  const socialLinks = giveaway.socialLinks || [];

  async function enterSignedIn() {
    setBusy(true);
    setError(null);
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
    const q = new URLSearchParams();
    q.set("email", value);
    if (ref) q.set("ref", ref);
    q.set("utm_source", "giveaway");
    q.set("utm_campaign", giveaway.slug);
    window.location.href = `/giveaway/${giveaway.slug}/entered?${q.toString()}`;
  }

  return (
    <article className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.headline}>{giveaway.prizeHeadline}</h1>
        {status === "live" && (
          <p className={styles.statusNote}>{daysUntilCopy(days)}</p>
        )}
        {status === "scheduled" && (
          <p className={styles.statusNote}>This giveaway has not started yet.</p>
        )}
        {status === "ended" && (
          <p className={styles.statusNote}>This draw has closed.</p>
        )}
      </header>

      <div className={styles.prose}>
        {intro.map((paragraph, i) => (
          <p key={`intro-${i}`}>{paragraph}</p>
        ))}

        {steps.length > 0 && (
          <>
            <h2>How to enter</h2>
            {stepsBeforeCta.length > 0 && (
              <ol className={styles.steps}>
                {stepsBeforeCta.map((step, i) => (
                  <li key={`step-before-${i}`}>{step}</li>
                ))}
              </ol>
            )}
          </>
        )}

        {status === "live" && (
          <div className={styles.enterBlock}>
            {signedIn ? (
              <button
                type="button"
                className="button button-primary"
                disabled={busy}
                onClick={enterSignedIn}
              >
                {busy ? "…" : giveaway.ctaEnterLabel || "Enter to win"}
              </button>
            ) : (
              <form className={styles.form} onSubmit={submitEmail} noValidate>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  disabled={busy}
                  autoComplete="email"
                />
                <button type="submit" className="button button-primary" disabled={busy}>
                  {busy ? "…" : giveaway.ctaSubscribeLabel || "Enter to win"}
                </button>
              </form>
            )}
            {error && <p className={styles.error}>{error}</p>}
          </div>
        )}

        {stepsAfterCta.length > 0 && (
          <ol className={styles.steps} start={stepsBeforeCta.length + 1}>
            {stepsAfterCta.map((step, i) => (
              <li key={`step-after-${i}`}>{step}</li>
            ))}
          </ol>
        )}

        {socialLinks.length > 0 && (
          <p className={styles.social}>
            Follow{" "}
            {socialLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && (i === socialLinks.length - 1 ? " and " : ", ")}
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </span>
            ))}{" "}
            on Instagram to never miss a moment of high-octane pickled content.
          </p>
        )}

        {(giveaway.closing || []).map((paragraph, i) => (
          <p key={`closing-${i}`}>{paragraph}</p>
        ))}

        {giveaway.rulesText ? (
          <p className={styles.rules}>{giveaway.rulesText}</p>
        ) : null}

        {next && (
          <p className={styles.nextLink}>
            <Link href={`/giveaway/${next.slug}`}>See {next.title}</Link>
          </p>
        )}
      </div>
    </article>
  );
}
