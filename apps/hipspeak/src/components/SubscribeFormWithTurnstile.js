"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Turnstile } from "next-turnstile";
import {
  trackSubscribeFormStart,
  trackSubscribeFormSubmit,
} from "@publication-websites/reader-events";
import { siteConfig, BRAND } from "@/config/site";
import styles from "./SubscribeBlock.module.css";

const MAGIC_BASE = siteConfig.magicSubscribeBase;
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function isLocalhost() {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function articleSlugFromPath(pathname) {
  if (!pathname?.startsWith("/word/")) return undefined;
  return pathname.split("/").filter(Boolean)[1] || undefined;
}

export default function SubscribeFormWithTurnstile({
  initialEmail,
  layout = "stack",
  magicPath = "",
  utmCampaign,
  /** If set, run this instead of leaving the page for magic. */
  onStaySubmit,
}) {
  const pathname = usePathname();
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef(null);
  const funnelStartedRef = useRef(false);
  const isBanner = layout === "banner";
  const funnelProps = {
    placement: layout,
    ...(articleSlugFromPath(pathname) ? { articleSlug: articleSlugFromPath(pathname) } : {}),
  };

  useEffect(() => setMounted(true), []);

  const handleEmailFocus = () => {
    if (funnelStartedRef.current) return;
    funnelStartedRef.current = true;
    trackSubscribeFormStart(funnelProps);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const email = emailRef.current?.value?.trim();
    if (!email) return;
    if (TURNSTILE_SITE_KEY && !token && !(mounted && isLocalhost())) return;
    trackSubscribeFormSubmit(funnelProps);
    setLoading(true);
    const params = new URLSearchParams();
    params.set("email", email);
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
        const v = u.searchParams.get(k);
        if (v) params.set(k, v);
      });
      if (!params.has("utm_source")) params.set("utm_source", BRAND);
      if (utmCampaign) params.set("utm_campaign", utmCampaign);
      else if (!params.has("utm_campaign")) params.set("utm_campaign", "form_submit");
    }
    if (token) params.set("cf-turnstile-response", token);
    if (onStaySubmit) {
      Promise.resolve(onStaySubmit(email, params)).catch(() => {
        setLoading(false);
      });
      return;
    }
    const base = magicPath
      ? `${MAGIC_BASE.replace(/\/?$/, "/")}${String(magicPath).replace(/^\//, "")}`
      : MAGIC_BASE;
    window.location.href = `${base}?${params.toString()}`;
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
                onFocus={handleEmailFocus}
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
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              placeholder="Email address"
              required
              defaultValue={initialEmail}
              disabled={loading}
              onFocus={handleEmailFocus}
            />
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
            <button
              type="submit"
              className="button button-primary"
              disabled={!verified || loading}
            >
              {loading ? "Submitting…" : "Subscribe"}
            </button>
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
