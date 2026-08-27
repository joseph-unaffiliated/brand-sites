"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  GIVEAWAYS,
  getCurrentOrUpcoming,
  isGiveawayListed,
} from "@/config/giveaways";
import { callGiveawayApi } from "@/lib/giveaway-api";
import { siteConfig } from "@/config/site";
import styles from "../app/profile/page.module.css";

export default function GiveawayPartnerPanel() {
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const [codes, setCodes] = useState([]);
  const [entries, setEntries] = useState([]);
  const [busySlug, setBusySlug] = useState(null);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callGiveawayApi(
        { action: "stats", brand: siteConfig.brandId },
        { bearer: true },
      );
      setIsPartner(Boolean(data.isPartner));
      setCodes(data.codes || []);
      setEntries(data.entries || []);
    } catch {
      setIsPartner(false);
      setCodes([]);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createPartnerCode(slug) {
    setBusySlug(slug);
    try {
      await callGiveawayApi(
        {
          action: "create_code",
          brand: siteConfig.brandId,
          giveawaySlug: slug,
          type: "partner",
          label: "Partner link",
        },
        { bearer: true },
      );
      await load();
    } catch {
      setError("Could not create tracking link.");
    } finally {
      setBusySlug(null);
    }
  }

  function linkForCode(slug, code) {
    const origin = siteConfig.siteUrl.replace(/\/$/, "");
    return `${origin}/giveaway/${slug}?ref=${encodeURIComponent(code)}`;
  }

  async function copyLink(slug, code) {
    try {
      await navigator.clipboard.writeText(linkForCode(slug, code));
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  const featured = getCurrentOrUpcoming();
  const list = GIVEAWAYS.slice().sort(
    (a, b) => Date.parse(b.drawAt) - Date.parse(a.drawAt),
  );

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Giveaways</h2>
        <p className={styles.loading}>Loading…</p>
      </section>
    );
  }

  if (!isPartner && !entries.length && !codes.length) {
    if (!featured || !isGiveawayListed(featured)) return null;
    return (
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Giveaways</h2>
        <p className={styles.accountLine}>
          <Link href={`/giveaway/${featured.slug}`}>Enter {featured.title}</Link>
        </p>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Giveaways</h2>
      {error && <p className={styles.error}>{error}</p>}

      {entries.length > 0 && (
        <ul className={styles.brandList}>
          {entries.map((entry) => {
            const g = GIVEAWAYS.find((x) => x.slug === entry.giveawaySlug);
            const referral = codes.find(
              (c) => c.giveawaySlug === entry.giveawaySlug && c.type === "referral",
            );
            const tickets =
              (Number(entry.baseTickets?.value ?? entry.baseTickets) || 0) +
              (Number(entry.bonusTickets?.value ?? entry.bonusTickets) || 0);
            return (
              <li key={entry.giveawaySlug} className={styles.brandItem}>
                <span className={styles.brandName}>
                  {g?.title || entry.giveawaySlug}
                  {tickets ? ` · ${tickets} ticket${tickets === 1 ? "" : "s"}` : ""}
                </span>
                <span className={styles.brandActions}>
                  <Link href={`/giveaway/${entry.giveawaySlug}`}>View</Link>
                  {referral?.code ? (
                    <button
                      type="button"
                      className={styles.signOutButton}
                      onClick={() => copyLink(entry.giveawaySlug, referral.code)}
                    >
                      {copied === referral.code ? "Copied" : "Copy share link"}
                    </button>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {isPartner && (
        <>
          <p className={styles.accountLine} style={{ marginTop: "1.25rem" }}>
            <strong>Partner tracking</strong>
          </p>
          <ul className={styles.brandList}>
            {list.map((g) => {
              const partnerCodes = codes.filter(
                (c) => c.giveawaySlug === g.slug && c.type === "partner",
              );
              return (
                <li key={g.slug} className={styles.brandItem}>
                  <span className={styles.brandName}>{g.title}</span>
                  <span className={styles.brandActions}>
                    {partnerCodes.length === 0 ? (
                      <button
                        type="button"
                        className={styles.signOutButton}
                        disabled={busySlug === g.slug}
                        onClick={() => createPartnerCode(g.slug)}
                      >
                        {busySlug === g.slug ? "…" : "Create tracking link"}
                      </button>
                    ) : (
                      partnerCodes.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          className={styles.signOutButton}
                          onClick={() => copyLink(g.slug, c.code)}
                        >
                          {copied === c.code
                            ? "Copied"
                            : `Copy link (${c.creditedSubs || 0} subs)`}
                        </button>
                      ))
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
