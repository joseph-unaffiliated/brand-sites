"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import { compareOriginalDateDesc, originalDateLabel } from "@/lib/vault-dates";
import styles from "@/app/from-the-vault/page.module.css";

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
  return compareOriginalDateDesc(a.issue, b.issue);
}

const DESKTOP_COLUMNS = 3;
/** Card body height as a fraction of card width, for balancing columns. */
const CARD_BODY_ESTIMATE = 0.95;

/**
 * Deal cards into columns shortest-first so order reads across rows. Each
 * entry keeps its list index as the CSS `order` used when columns collapse.
 */
function packColumns(entries) {
  const columns = Array.from({ length: DESKTOP_COLUMNS }, () => ({ height: 0, entries: [] }));
  entries.forEach((entry, order) => {
    const target = columns.reduce((min, col) => (col.height < min.height ? col : min), columns[0]);
    target.entries.push({ ...entry, order });
    target.height += entry.aspect + CARD_BODY_ESTIMATE;
  });
  return columns.map((col) => col.entries);
}

function imageAspect(issue) {
  const w = Number(issue.mainImageWidth) || 3;
  const h = Number(issue.mainImageHeight) || 2;
  return h / w;
}

function SubscribeCard({ order }) {
  return (
    <HideWhenSubscribed>
      <article className={styles.issueCard} style={{ order }}>
        <div className={styles.issueCardPlaceholder}>
          <div className={styles.issueCardBody}>
            <h3>More issues coming soon</h3>
            <p className={styles.issueDek}>
              New issues drop weekly. Subscribe to get them in your inbox.
            </p>
            <a className={styles.issueCta} href="/#subscribe">
              Subscribe
            </a>
          </div>
        </div>
      </article>
    </HideWhenSubscribed>
  );
}

function IssueCard({ issue, order }) {
  return (
    <article className={styles.issueCard} style={{ order }}>
      <Link href={`/article/${issue.slug}`} className={styles.issueCardLink}>
        <div className={styles.issueCardImage}>
          <Image
            src={issue.mainImage}
            alt=""
            width={issue.mainImageWidth || 400}
            height={issue.mainImageHeight || 267}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className={styles.issueCardBody}>
          <p className={styles.issueDate}>{originalDateLabel(issue) || "—"}</p>
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
 * @param {{ issues: Array<{ _id?: string; slug: string; title: string; summary?: string | null; mainImage: string; mainImageWidth?: number; mainImageHeight?: number; originalYear?: number | null; originalPublication?: string | null; searchText: string }> }} props
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
      return searchable.map(({ issue }) => issue).sort(compareOriginalDateDesc);
    }
    const tokens = queryTokens(queryNormalized);
    return searchable
      .filter(({ issue }) => tokens.every((token) => issue.searchText.includes(token)))
      .sort((a, b) => compareSearchResults(a, b, tokens))
      .map(({ issue }) => issue);
  }, [searchable, queryNormalized]);

  const columns = useMemo(() => {
    const entries = visible.map((issue) => ({ issue, aspect: imageAspect(issue) }));
    if (!queryNormalized) entries.push({ issue: null, aspect: 0.4 });
    return packColumns(entries);
  }, [visible, queryNormalized]);

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
          {columns.map((entries, index) => (
            <div key={index} className={styles.issueColumn}>
              {entries.map((entry) =>
                entry.issue ? (
                  <IssueCard
                    key={entry.issue._id ?? entry.issue.slug}
                    issue={entry.issue}
                    order={entry.order}
                  />
                ) : (
                  <SubscribeCard key="subscribe" order={entry.order} />
                ),
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
