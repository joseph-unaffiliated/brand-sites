"use client";

import { useMemo, useState } from "react";
import WordCard from "@/components/WordCard";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import styles from "@/app/archive/page.module.css";

export default function WordsBrowser({ entries }) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const hay = [entry.title, entry.pronunciation, entry.think]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, query]);

  return (
    <>
      <div className={styles.filterBar}>
        <label className={styles.searchControl}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search word or definition"
            aria-label="Search word or definition"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className={styles.emptyState}>No words match that search. Try another word.</p>
      ) : (
        <div className={styles.issueMosaic}>
          {visible.map((entry) => (
            <WordCard key={entry._id ?? entry.slug} entry={entry} />
          ))}
          {!query ? (
            <HideWhenSubscribed>
              <article className={styles.issueCard}>
                <div className={styles.issueCardPlaceholder}>
                  <div className={styles.issueCardBody}>
                    <h3>More words coming soon</h3>
                    <p className={styles.issueDek}>
                      New words drop weekly. Subscribe to get them in your inbox.
                    </p>
                    <a className={styles.issueCta} href="/#subscribe">
                      Subscribe
                    </a>
                  </div>
                </div>
              </article>
            </HideWhenSubscribed>
          ) : null}
        </div>
      )}
    </>
  );
}
