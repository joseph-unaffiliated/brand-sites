"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Turnstile } from "next-turnstile";
import { trackSubscribeFormSubmit } from "@publication-websites/reader-events";
import { useCart } from "@/context/CartContext";
import { useSubscriber } from "@/context/SubscriberContext";
import { siteConfig } from "@/config/site";
import styles from "./shop.module.css";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isLocalhost() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

/** Base64url of the URI-encoded URL: the format `/redirect` decodes. */
function encodeRedirectUrl(url) {
  return btoa(encodeURIComponent(url)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Subscribe through magic (Turnstile-verified, like every other form); magic hands off to
 * `/redirect`, which confirms the subscription and forwards to checkout.
 */
function subscribeThenCheckoutUrl(email, checkoutUrl, turnstileToken) {
  const params = new URLSearchParams();
  params.set("email", email);
  const page = new URL(window.location.href);
  ["utm_source", "utm_medium", "utm_term", "utm_content"].forEach((k) => {
    const v = page.searchParams.get(k);
    if (v) params.set(k, v);
  });
  if (!params.has("utm_source")) params.set("utm_source", siteConfig.brandId);
  params.set("utm_campaign", "checkout");
  params.set("redirect", "");
  params.set("url", encodeRedirectUrl(checkoutUrl));
  params.set("sitename", "checkout");
  if (turnstileToken) params.set("cf-turnstile-response", turnstileToken);
  return `${siteConfig.magicSubscribeBase}?${params.toString()}`;
}

/**
 * Email step between the cart and Shopify checkout. Either button requires an email; it is
 * attached to the cart so checkout opens with Contact filled in.
 */
export default function CheckoutEmailModal({ onClose }) {
  const { cart, prepareCheckout, pending } = useCart();
  const { isSubscribed, email: subscriberEmail } = useSubscriber();
  const [email, setEmail] = useState(() => cart?.buyerEmail || subscriberEmail || "");
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [leaving, setLeaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const busy = pending || leaving;
  const needsTurnstile = !!TURNSTILE_SITE_KEY && !isSubscribed;
  const verified = !needsTurnstile || !!token || (typeof window !== "undefined" && isLocalhost());

  async function go(subscribe) {
    const value = email.trim();
    if (!EMAIL_PATTERN.test(value)) {
      setError("Enter a valid email address to continue.");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setLeaving(true);
    try {
      const checkoutUrl = await prepareCheckout(value);
      if (!checkoutUrl) throw new Error("Checkout is unavailable right now.");
      if (subscribe) {
        trackSubscribeFormSubmit({ placement: "checkout" });
        window.location.assign(subscribeThenCheckoutUrl(value, checkoutUrl, token));
      } else {
        window.location.assign(checkoutUrl);
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLeaving(false);
    }
  }

  return (
    <>
      <div className={styles.checkoutModalBackdrop} onClick={busy ? undefined : onClose} aria-hidden />
      <div className={styles.checkoutModal} role="dialog" aria-modal="true" aria-labelledby="checkout-email-title">
        <button type="button" className={styles.checkoutModalClose} onClick={onClose} aria-label="Close" disabled={busy}>
          ×
        </button>
        <h2 id="checkout-email-title" className={styles.checkoutModalTitle}>
          Enter your email
        </h2>
        <form
          className={styles.checkoutModalForm}
          onSubmit={(e) => {
            e.preventDefault();
            if (verified) go(!isSubscribed);
          }}
          noValidate
        >
          <input
            ref={inputRef}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="Email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            required
          />
          {needsTurnstile ? (
            <Turnstile siteKey={TURNSTILE_SITE_KEY} onVerify={setToken} onExpire={() => setToken(null)} theme="light" />
          ) : null}
          {error ? <p className={styles.errorText}>{error}</p> : null}
          <button type="submit" className="button button-primary" disabled={busy || !verified}>
            {busy ? "One moment…" : isSubscribed ? "Continue to checkout" : 'Checkout and Subscribe to "From the Vault"'}
          </button>
          {!isSubscribed ? (
            <button type="button" className={styles.checkoutModalSkip} onClick={() => go(false)} disabled={busy}>
              Checkout without Subscribing
            </button>
          ) : null}
        </form>
        <p className={styles.checkoutModalNote}>
          By entering your email you agree to our <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy</Link>.
        </p>
      </div>
    </>
  );
}
