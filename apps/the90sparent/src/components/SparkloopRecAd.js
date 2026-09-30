"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  resolveSparkloopTestMode,
  useSparkloopRecommendation,
} from "@publication-websites/sparkloop-client";
import { trackAdClick, useAdImpression } from "@publication-websites/reader-events";
import { siteConfig } from "@/config/site";
import { useSubscriber } from "@/context/SubscriberContext";
import styles from "./SparkloopRecAd.module.css";

const TEST_MODE = resolveSparkloopTestMode(siteConfig.sparkloopTestMode);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAGLINE_SEPARATOR = /\s+[-–—|]\s+|:\s+/;
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Partners often write "Name - tagline" or "Name: tagline" in the name field; split so the
 * name can lead. Names without a separator come back whole.
 */
function splitName(name) {
  const full = String(name || "").trim();
  const match = TAGLINE_SEPARATOR.exec(full);
  if (!match) return { title: full, tagline: "" };
  const title = full.slice(0, match.index).trim();
  const tagline = full.slice(match.index + match[0].length).trim();
  if (title.length < 2 || tagline.length < 3) return { title: full, tagline: "" };
  return { title, tagline };
}

/** Horizontal cards size the square logo to the text column's height. */
function useFillHeightSize(ref, enabled) {
  const [size, setSize] = useState(0);
  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return undefined;
    const measure = () => setSize(Math.round(el.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, enabled]);
  return size;
}

/** Generate a little before the slot scrolls into view so the card is ready when seen. */
function useNearViewport(ref, eager) {
  const [near, setNear] = useState(eager);
  useEffect(() => {
    if (near) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, ref]);
  return near;
}

/**
 * A SparkLoop Client API recommendation rendered as a house ad (inArticle card, 160px rail,
 * or sticky bar). Known subscribers get one-click subscribe; others enter an email.
 *
 * @param {{
 *   placement: 'inArticle' | 'rail' | 'sticky',
 *   className?: string,
 *   onReady?: () => void,
 *   onEmpty?: () => void,
 * }} props
 */
export default function SparkloopRecAd({ placement, className, onReady, onEmpty }) {
  const wrapperRef = useRef(null);
  const cardRef = useRef(null);
  const mainRef = useRef(null);
  // The sticky bar stays hidden until ready, so it can't wait for visibility.
  const near = useNearViewport(wrapperRef, placement === "sticky");
  const { status, rec, subscribe } = useSparkloopRecommendation({
    publicationId: siteConfig.sparkloopPublicationId,
    testMode: TEST_MODE,
    enabled: near,
  });
  const { email: knownEmail } = useSubscriber();
  const [email, setEmail] = useState("");
  const [submit, setSubmit] = useState({ status: "idle", email: "" });

  const onReadyRef = useRef(onReady);
  const onEmptyRef = useRef(onEmpty);
  useEffect(() => {
    onReadyRef.current = onReady;
    onEmptyRef.current = onEmpty;
  });

  useEffect(() => {
    if (status === "ready") onReadyRef.current?.();
    if (status === "empty") onEmptyRef.current?.();
  }, [status]);

  const trackProps = {
    placement,
    adType: "sparkloop_rec",
    destinationUrl: rec ? `sparkloop:${rec.uuid}` : "",
    sparkloopName: rec?.name || "",
    sparkloopType: rec?.type || "",
  };
  useAdImpression(cardRef, { ...trackProps, enabled: status === "ready" });

  const isRail = placement === "rail";
  const logoSize = useFillHeightSize(mainRef, status === "ready" && !!rec?.logo && !isRail);

  async function handleSubscribe(e) {
    e.preventDefault();
    const target = (knownEmail || email).trim();
    if (!EMAIL_RE.test(target)) {
      setSubmit({ status: "invalid", email: target });
      return;
    }
    trackAdClick(trackProps);
    setSubmit({ status: "submitting", email: target });
    try {
      await subscribe(target);
      setSubmit({ status: "done", email: target });
    } catch (err) {
      console.warn("SparkLoop subscribe failed:", err?.error || err?.message || err);
      setSubmit({ status: "error", email: target });
    }
  }

  if (status !== "ready" || !rec) {
    return <div ref={wrapperRef} className={styles.pending} aria-hidden="true" />;
  }

  const busy = submit.status === "submitting";
  const done = submit.status === "done";
  const { title, tagline } = splitName(rec.name);
  const logo = rec.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={rec.logo} alt="" className={styles.logo} />
  ) : null;

  return (
    <div
      ref={cardRef}
      className={`${styles.card} ${styles[placement] || styles.inArticle} ${className || ""}`}
      style={logoSize ? { "--logo-size": `${logoSize}px` } : undefined}
      data-recommendation-uuid={rec.uuid}
    >
      {isRail ? null : logo}
      <div ref={mainRef} className={styles.main}>
        <p className={styles.label}>Recommended newsletter</p>
        {isRail ? logo : null}
        <div className={styles.text}>
          <p className={styles.name}>{title}</p>
          {tagline ? <p className={styles.tagline}>{tagline}</p> : null}
          {rec.description ? <p className={styles.description}>{rec.description}</p> : null}
        </div>

        {done ? (
          <p className={styles.status} role="status">
            Subscribed. Check your inbox to confirm.
          </p>
        ) : (
          <form className={styles.form} onSubmit={handleSubscribe} noValidate>
            {!knownEmail ? (
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@email.com"
                aria-label={`Email to subscribe to ${rec.name}`}
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                required
              />
            ) : null}
            <button type="submit" className={styles.button} disabled={busy}>
              {busy ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}

        {!done && knownEmail ? (
          <p className={styles.note}>Subscribes {knownEmail}</p>
        ) : null}
        {submit.status === "invalid" ? (
          <p className={styles.error} role="alert">
            Enter a valid email.
          </p>
        ) : null}
        {submit.status === "error" ? (
          <p className={styles.error} role="alert">
            Couldn&apos;t subscribe. Try again.
          </p>
        ) : null}
      </div>
    </div>
  );
}
