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
import {
  clearReaderToken,
  fetchReaderProfileForSite,
  getReaderToken,
  isReaderProfileV2Enabled,
} from "@/lib/reader-profile";
import {
  networkBrands,
  discoverMoreSubscribeIds,
  discoverMorePreSubscribeIds,
} from "@/data/networkNewsletters";
import { fetchReaderTriviaStats } from "@/lib/fetch-reader-trivia-stats";
import { readTriviaState } from "@/lib/trivia-points";
import styles from "./page.module.css";

const READ_ARTICLES_KEY = `read_articles_${BRAND}`;

function getLocalReadSlugs() {
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

function articleUrlForBrand(brandId, slug, brandById, currentBrandId) {
  if (brandId === currentBrandId) return `/article/${slug}`;
  const brand = brandById[brandId];
  if (!brand?.signupUrl) return null;
  try {
    const host = new URL(brand.signupUrl).hostname.replace(/^magic\./, "");
    return `https://${host}/article/${encodeURIComponent(slug)}`;
  } catch {
    return null;
  }
}

function buildReadingItems(readArticles, localSlugs, brandById, currentBrandId) {
  if (isReaderProfileV2Enabled() && readArticles && typeof readArticles === "object") {
    const items = [];
    for (const [brandId, slugs] of Object.entries(readArticles)) {
      if (!Array.isArray(slugs) || !slugs.length) continue;
      const brandName = brandById[brandId]?.displayName ?? brandById[brandId]?.name ?? brandId;
      for (const slug of slugs.slice().reverse()) {
        items.push({
          key: `${brandId}:${slug}`,
          brandId,
          brandName,
          slug,
          href: articleUrlForBrand(brandId, slug, brandById, currentBrandId),
        });
      }
    }
    if (items.length) return items;
  }
  return localSlugs.slice().reverse().map((slug) => ({
    key: slug,
    brandId: currentBrandId,
    brandName: null,
    slug,
    href: `/article/${slug}`,
  }));
}

export default function ProfilePage() {
  const { isSubscribed, email, subscribedAt } = useSubscriber();
  const [subscribedBrands, setSubscribedBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [readArticles, setReadArticles] = useState(null);
  const [readingItems, setReadingItems] = useState([]);
  const [triviaPoints, setTriviaPoints] = useState(0);
  const [triviaAnswered, setTriviaAnswered] = useState(0);

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
    fetchReaderProfileForSite(token)
      .then((data) => {
        setSubscribedBrands(data.subscribedBrands?.length ? data.subscribedBrands : [siteConfig.brandId]);
        setReadArticles(data.readArticles ?? {});
      })
      .catch(() => fallbackLocal())
      .finally(() => setLoading(false));
  }, [isSubscribed, email]);

  useEffect(() => {
    const brandById = Object.fromEntries(networkBrands.map((b) => [b.id, b]));
    const localSlugs = getLocalReadSlugs();
    setReadingItems(buildReadingItems(readArticles, localSlugs, brandById, siteConfig.brandId));
  }, [readArticles]);

  useEffect(() => {
    const local = readTriviaState();
    const answered = Object.values(local.byQuestion || {}).filter((q) => q?.answered).length;
    setTriviaPoints(local.totalPoints || 0);
    setTriviaAnswered(answered);

    const token = getReaderToken();
    if (token) {
      fetchReaderTriviaStats(token).then((data) => {
        if (typeof data?.totalPoints === "number") setTriviaPoints(data.totalPoints);
        if (typeof data?.questionsAnswered === "number") setTriviaAnswered(data.questionsAnswered);
      });
    }
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
            <strong>Subscribed to The Pickle Report since:</strong> {formatDate(subscribedAt) ?? subscribedAt}
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
          <p className={styles.error}>Could not load subscriptions. You can still manage The Pickle Report below.</p>
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
        <h2 className={styles.sectionTitle}>Pickle trivia</h2>
        <p className={styles.accountLine}>
          <strong>Score:</strong> {triviaPoints} point{triviaPoints === 1 ? "" : "s"}
        </p>
        <p className={styles.accountLine}>
          <strong>Questions answered:</strong> {triviaAnswered}
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Articles you&apos;ve read</h2>
        {readingItems.length === 0 ? (
          <p className={styles.empty}>No reading history yet.</p>
        ) : (
          <ul className={styles.readingList}>
            {readingItems.map((item) => (
              <li key={item.key} className={styles.readingItem}>
                {item.href ? (
                  item.brandId === siteConfig.brandId ? (
                    <Link href={item.href}>{item.slug.replace(/-/g, " ")}</Link>
                  ) : (
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {item.brandName}: {item.slug.replace(/-/g, " ")}
                    </a>
                  )
                ) : (
                  <span>
                    {item.brandName ? `${item.brandName}: ` : ""}
                    {item.slug.replace(/-/g, " ")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
