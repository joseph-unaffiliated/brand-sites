"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "@/app/archive/page.module.css";

function publishedTime(issue) {
  if (!issue?.publishedDate) return null;
  const t = new Date(issue.publishedDate).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Newest first; undated / invalid dates last, stable for ties. */
function sortByPublishedDateDesc(a, b) {
  const ta = publishedTime(a);
  const tb = publishedTime(b);
  if (ta != null && tb != null && ta !== tb) return tb - ta;
  if (ta != null && tb == null) return -1;
  if (ta == null && tb != null) return 1;
  return String(a?.slug || "").localeCompare(String(b?.slug || ""));
}

function queryTokens(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function countOccurrences(haystack, token) {
  if (!haystack || !token) return 0;
  let count = 0;
  let index = 0;
  while ((index = haystack.indexOf(token, index)) !== -1) {
    count += 1;
    index += token.length;
  }
  return count;
}

/** Search rank: title token hits → summary token hits → full-text occurrences → publish date. */
function compareSearchResults(a, b, tokens) {
  let titleA = 0;
  let titleB = 0;
  let dekA = 0;
  let dekB = 0;
  let occA = 0;
  let occB = 0;

  for (const token of tokens) {
    if (a.titleText.includes(token)) titleA += 1;
    if (b.titleText.includes(token)) titleB += 1;
    if (a.dekText.includes(token)) dekA += 1;
    if (b.dekText.includes(token)) dekB += 1;
    occA += countOccurrences(a.issue.searchText, token);
    occB += countOccurrences(b.issue.searchText, token);
  }

  if (titleA !== titleB) return titleB - titleA;
  if (dekA !== dekB) return dekB - dekA;
  if (occA !== occB) return occB - occA;
  return sortByPublishedDateDesc(a.issue, b.issue);
}

function IssueCard({ issue }) {
  return (
    <article className={styles.issueCard}>
      <Link href={`/article/${issue.slug}`} className={styles.issueCardLink}>
        <div className={styles.issueCardImage}>
          <Image
            src={issue.mainImage}
            alt=""
            width={400}
            height={267}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className={styles.issueCardBody}>
          <p className={styles.issueDate}>
            {issue.publishedDate
              ? new Date(issue.publishedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
          <h3>{issue.title}</h3>
          {issue.summary ? <p className={styles.issueDek}>{issue.summary}</p> : null}
          <span className={styles.issueCta}>Read issue</span>
        </div>
      </Link>
    </article>
  );
}

/**
 * Client-side archive search. State lives in `?q=` so searches are shareable.
 * @param {{ issues: Array<{ _id?: string; slug: string; title: string; summary?: string | null; mainImage: string; publishedDate?: string | null; searchText: string }> }} props
 */
export default function ArchiveBrowser({ issues }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = (searchParams.get("q") || "").trim();
  const queryNormalized = query.toLowerCase();
  const [searchDraft, setSearchDraft] = useState(query);

  const replaceQuery = useCallback(
    (nextQuery) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery) params.set("q", nextQuery);
      else params.delete("q");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  useEffect(() => {
    setSearchDraft(query);
  }, [query]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = searchDraft.trim();
      if (trimmed === query) return;
      replaceQuery(trimmed);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query, replaceQuery]);

  const searchable = useMemo(
    () =>
      issues.map((issue) => ({
        issue,
        titleText: String(issue.title || "").toLowerCase(),
        dekText: String(issue.summary || "").toLowerCase(),
      })),
    [issues],
  );

  const visible = useMemo(() => {
    if (!queryNormalized) {
      return searchable.map(({ issue }) => issue).sort(sortByPublishedDateDesc);
    }
    const tokens = queryTokens(queryNormalized);
    return searchable
      .filter(({ issue }) => tokens.every((token) => issue.searchText.includes(token)))
      .sort((a, b) => compareSearchResults(a, b, tokens))
      .map(({ issue }) => issue);
  }, [searchable, queryNormalized]);

  return (
    <div className={isPending ? styles.browserPending : undefined}>
      <div className={styles.filterBar}>
        <label className={styles.searchControl}>
          <span className={styles.visuallyHidden}>Search issues</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search issues…"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <p className={styles.emptyState}>
          No issues match “{query}”. Try a different search term.
        </p>
      ) : (
        <div className={styles.issueMosaic}>
          {visible.map((issue) => (
            <IssueCard key={issue._id ?? issue.slug} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
