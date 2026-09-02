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
  const [entryCheck, setEntryCheck] = useState("pending"); // pending | none | entered
  const [shareUrl, setShareUrl] = useState(null);
  const [credited, setCredited] = useState(null);
  const [tickets, setTickets] = useState(null);
  const [copied, setCopied] = useState(false);

  const signedIn = isSubscribed || !!getReaderToken();
  const intro = giveaway.intro?.length ? giveaway.intro : [giveaway.prizeBody];
  const steps = giveaway.howToEnter || [];
  const socialLinks = giveaway.socialLinks || [];
  const previewEntered = searchParams.get("preview") === "entered";
  const alreadyEntered = previewEntered || entryCheck === "entered";

  useEffect(() => {
    if (previewEntered) {
      const origin =
        (typeof window !== "undefined" && window.location.origin) ||
        siteConfig.siteUrl.replace(/\/$/, "");
      setShareUrl(`${origin}/giveaway/${giveaway.slug}?ref=rpreview`);
      setCredited(0);
      setTickets(1);
      setEntryCheck("entered");
      return;
    }

    if (!getReaderToken()) {
      setEntryCheck("none");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const stats = await callGiveawayApi(
          {
            action: "stats",
            brand: siteConfig.brandId,
            giveawaySlug: giveaway.slug,
          },
          { bearer: true },
        );
        if (cancelled) return;
        const entry = (stats.entries || []).find((e) => e.giveawaySlug === giveaway.slug);
        const referral = (stats.codes || []).find((c) => c.type === "referral");
        if (!entry) {
          setEntryCheck("none");
          return;
        }
        const origin =
          (typeof window !== "undefined" && window.location.origin) ||
          siteConfig.siteUrl.replace(/\/$/, "");
        if (referral?.code) {
          setShareUrl(
            `${origin}/giveaway/${giveaway.slug}?ref=${encodeURIComponent(referral.code)}`,
          );
          setCredited(asCount(referral.creditedSubs));
        }
        setTickets(asCount(entry.baseTickets) + asCount(entry.bonusTickets));
        setEntryCheck("entered");
      } catch {
        if (!cancelled) setEntryCheck("none");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [giveaway.slug, previewEntered, signedIn]);

  function renderIntroParagraph(text, key) {
    const mark = "12 jars of McClure’s Pickles";
    const at = text.indexOf(mark);
    if (at === -1) return <p key={key}>{text}</p>;
    return (
      <p key={key}>
        {text.slice(0, at)}
        <strong>{mark}</strong>
        {text.slice(at + mark.length)}
      </p>
    );
  }

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
        {giveaway.heroImage ? (
          <figure className={styles.heroMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local giveaway asset; swap file in public/ */}
            <img
              src={giveaway.heroImage}
              alt={giveaway.heroImageAlt || giveaway.title}
              width={1200}
              height={800}
            />
          </figure>
        ) : null}
      </header>

      <div className={styles.prose}>
        {intro.map((paragraph, i) => renderIntroParagraph(paragraph, `intro-${i}`))}

        {alreadyEntered ? (
          <div className={`${styles.howToEnter} ${styles.entered}`}>
            <h2>{giveaway.successHeadline || "You’re entered in the draw!"}</h2>
            {tickets != null && (
              <p className={styles.ticketBox}>
                You have {tickets} ticket{tickets === 1 ? "" : "s"}.
              </p>
            )}
            {shareUrl && (
              <>
                <p>
                  To get more tickets, share your unique referral link. Each friend who
                  subscribes through it adds another ticket.
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
                </div>
              </>
            )}
          </div>
        ) : (
          (steps.length > 0 || status === "live") && (
            <div className={styles.howToEnter}>
              {steps.length > 0 && (
                <>
                  <h2>How to enter</h2>
                  <ol className={styles.steps}>
                    {steps.map((step, i) => (
                      <li key={`step-${i}`}>{step}</li>
                    ))}
                  </ol>
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
                      {busy ? "Submitting..." : giveaway.ctaEnterLabel || "Enter to win"}
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
                        {busy ? "Submitting..." : giveaway.ctaSubscribeLabel || "Enter to win"}
                      </button>
                    </form>
                  )}
                  {error && <p className={styles.error}>{error}</p>}
                </div>
              )}
            </div>
          )
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

        {giveaway.rulesText && !alreadyEntered ? (
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
