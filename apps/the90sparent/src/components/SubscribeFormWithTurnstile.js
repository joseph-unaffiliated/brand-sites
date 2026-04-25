"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Turnstile } from "next-turnstile";
import styles from "./SubscribeBlock.module.css";
import { siteConfig } from "@/config/site";

const MAGIC_BASE = siteConfig.magicSubscribeBase;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function isLocalhost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export default function SubscribeFormWithTurnstile({ initialEmail, layout = "stack" }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef(null);
  const isBanner = layout === "banner";

  useEffect(() => setMounted(true), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = emailRef.current?.value?.trim();
    if (!email) return;
    if (TURNSTILE_SITE_KEY && !token && !(mounted && isLocalhost())) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("email", email);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
        const v = u.searchParams.get(k);
        if (v) params.set(k, v);
      });
      if (!params.has("utm_source")) params.set("utm_source", siteConfig.brandId);
      if (!params.has("utm_campaign")) params.set("utm_campaign", "form_submit");
    }
    if (token) params.set("cf-turnstile-response", token);
    window.location.href = `${MAGIC_BASE}?${params.toString()}`;
  };

  const verified = !TURNSTILE_SITE_KEY || token || (mounted && isLocalhost());
  const showTurnstile = !!TURNSTILE_SITE_KEY;
  const isArticle = layout === "article";

  const onFormKeyDown = (e) => {
    if (e.key === "Enter" && verified && !loading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <form
        className={isArticle ? "articlepage-form" : styles.form}
        onSubmit={handleSubmit}
        onKeyDown={onFormKeyDown}
        noValidate
      >
        {isBanner ? (
          <>
            <div className={styles.formRow}>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                required
                defaultValue={initialEmail}
                disabled={loading}
              />
              <button
                type="submit"
                className={styles.submitArrow}
                aria-label="Subscribe"
                disabled={!verified || loading}
              >
                {loading ? "…" : "→"}
              </button>
            </div>
            {showTurnstile && (
              <div className={styles.turnstileWrapBanner}>
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setToken}
                  onExpire={() => setToken(null)}
                  theme="light"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.formRow}>
              <input
                ref={emailRef}
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                required
                defaultValue={initialEmail}
                disabled={loading}
              />
              <button
                type="submit"
                className={styles.submitPill}
                disabled={!verified || loading}
              >
                <span>{loading ? "Submitting…" : "Subscribe"}</span>
                <span className={styles.submitPillArrow} aria-hidden>
                  <svg
                    width="8"
                    height={(8 * 6) / 7}
                    viewBox="0 0 7 6"
                    fill="none"
                    role="presentation"
                    focusable="false"
                  >
                    <path
                      d="M0 2.91722H6.01145M6.01145 2.91722L3.44774 0.353516M6.01145 2.91722L3.44774 5.48093"
                      stroke="currentColor"
                    />
                  </svg>
                </span>
              </button>
            </div>
            {showTurnstile && (
              <div className={styles.turnstileWrap}>
                <Turnstile
                  siteKey={TURNSTILE_SITE_KEY}
                  onVerify={setToken}
                  onExpire={() => setToken(null)}
                  theme="light"
                />
              </div>
            )}
          </>
        )}
      </form>
      {!isArticle && (
        <p className={styles.note}>
          By entering your email you agree to our{" "}
          <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy</Link>.
        </p>
      )}
    </>
  );
}
