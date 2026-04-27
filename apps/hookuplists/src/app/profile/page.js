"use client";

/**
 * Reader profile: account info, verified newsletter list (via magic token), discover more.
 * Subscriptions are loaded from magic.* with Bearer token—not from marketing /api/email lookup.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { useSubscriber } from "@/context/SubscriberContext";
import { BRAND } from "@/lib/subscription";
import { clearReaderToken, fetchVerifiedSubscriptions, getReaderToken } from "@/lib/reader-profile";
import {
  networkBrands,
  discoverMoreSubscribeIds,
  discoverMorePreSubscribeIds,
} from "@/data/networkNewsletters";
import styles from "./page.module.css";

const READ_ARTICLES_KEY = `read_articles_${BRAND}`;

function getReadSlugs() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_ARTICLES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ProfilePage() {
  const { isSubscribed, email, subscribedAt } = useSubscriber();
  const [subscribedBrands, setSubscribedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [readSlugs, setReadSlugs] = useState([]);

  useEffect(() => {
    if (!isSubscribed || !email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setApiError(false);
    const token = getReaderToken();
    const fallbackLocal = () => {
      setSubscribedBrands([siteConfig.brandId]);
      setApiError(true);
    };
    if (!token) {
      setSubscribedBrands([siteConfig.brandId]);
      setLoading(false);
      return;
    }
    fetchVerifiedSubscriptions(token)
      .then((data) => {
        setSubscribedBrands(data.subscribedBrands?.length ? data.subscribedBrands : [siteConfig.brandId]);
      })
      .catch(() => fallbackLocal())
      .finally(() => setLoading(false));
  }, [isSubscribed, email]);

  useEffect(() => {
    setReadSlugs(getReadSlugs());
  }, []);

  if (!isSubscribed && !loading) {
    return (
      <div className={styles.needSubscribe}>
        <p>Subscribe to get a profile and manage your subscription.</p>
        <Link href="/#subscribe">Subscribe</Link>
      </div>
    );
  }

  const subscribedBrandsSet = new Set(subscribedBrands);
  const yourBrands = networkBrands.filter((b) => subscribedBrandsSet.has(b.id));

  const brandById = Object.fromEntries(networkBrands.map((b) => [b.id, b]));
  const discoverSubscribe = discoverMoreSubscribeIds
    .map((id) => brandById[id])
    .filter(Boolean)
    .filter((b) => !subscribedBrandsSet.has(b.id));
  const discoverPreSubscribe = discoverMorePreSubscribeIds
    .map((id) => brandById[id])
    .filter(Boolean)
    .filter((b) => !subscribedBrandsSet.has(b.id));
  const hasDiscoverMore = discoverSubscribe.length > 0 || discoverPreSubscribe.length > 0;

  const formatDate = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } catch {
      return null;
    }
  };

  const signOut = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`subscribed_${BRAND}`);
    localStorage.removeItem(`email_${BRAND}`);
    localStorage.removeItem(`subscribed_at_${BRAND}`);
    clearReaderToken();
    window.location.href = "/";
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.heading}>Your profile</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Account</h2>
        <p className={styles.accountLine}>
          <strong>Email:</strong> {email ?? "—"}
        </p>
        {subscribedAt && (
          <p className={styles.accountLine}>
            <strong>Subscribed to Hookup Lists since:</strong> {formatDate(subscribedAt) ?? subscribedAt}
          </p>
        )}
        <p className={styles.accountLine}>
          <button type="button" onClick={signOut} className={styles.signOutButton}>
            Sign out
          </button>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your subscriptions</h2>
        {loading ? (
          <p className={styles.loading}>Loading…</p>
        ) : apiError ? (
          <p className={styles.error}>Could not load subscriptions. You can still manage Hookup Lists below.</p>
        ) : null}
        {!loading && (
          <ul className={styles.brandList}>
            {yourBrands.length === 0 && !apiError && (
              <li className={styles.empty}>No subscriptions found. If you just subscribed, try refreshing.</li>
            )}
            {yourBrands.map((brand) => (
              <li key={brand.id} className={styles.brandItem}>
                <span className={styles.brandName}>{brand.displayName ?? brand.name}</span>
                <span className={styles.brandActions}>
                  <a
                    href={`${brand.signupUrl.replace(/\/?$/, "")}/unsubscribe?email=${encodeURIComponent(email ?? "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Unsubscribe
                  </a>
                  <a
                    href={`${brand.signupUrl.replace(/\/?$/, "")}/snooze?email=${encodeURIComponent(email ?? "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Snooze
                  </a>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Discover more</h2>
        {!hasDiscoverMore ? (
          <p className={styles.empty}>You’re subscribed to all our newsletters. Thanks!</p>
        ) : (
          <ul className={styles.brandList}>
            {discoverSubscribe.map((brand) => (
              <li key={brand.id} className={styles.brandItem}>
                <span className={styles.brandName}>{brand.displayName ?? brand.name}</span>
                <a
                  className={styles.recommendLink}
                  href={`${brand.signupUrl.replace(/\/?$/, "")}?email=${encodeURIComponent(email ?? "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Subscribe
                </a>
              </li>
            ))}
            {discoverPreSubscribe.map((brand) => (
              <li key={brand.id} className={`${styles.brandItem} ${styles.brandItemPreSubscribe}`}>
                <span className={styles.brandName}>{brand.displayName ?? brand.name}</span>
                <a
                  className={styles.preSubscribeLink}
                  href={`${brand.signupUrl.replace(/\/?$/, "")}?email=${encodeURIComponent(email ?? "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {brand.preSubscribeLabel ?? "Pre-subscribe"}
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Articles you&apos;ve read</h2>
        {readSlugs.length === 0 ? (
          <p className={styles.empty}>No reading history yet.</p>
        ) : (
          <ul className={styles.readingList}>
            {readSlugs.slice().reverse().map((slug) => (
              <li key={slug} className={styles.readingItem}>
                <Link href={`/article/${slug}`}>{slug.replace(/-/g, " ")}</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
