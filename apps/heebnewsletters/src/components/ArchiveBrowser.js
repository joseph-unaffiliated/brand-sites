"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import {
  compareVaultSort,
  originalCardLabel,
  originalIssueNumber,
  originalYearValue,
} from "@/lib/vault-dates";
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

/** Search rank: title token hits → summary token hits → full-text occurrences → selected sort. */
function compareSearchResults(a, b, tokens, sort) {
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
  return compareVaultSort(a.issue, b.issue, sort);
}

const DESKTOP_COLUMNS = 3;
/** Card body height as a fraction of card width, for balancing columns. */
const CARD_BODY_ESTIMATE = 0.95;
const DEFAULT_SORT = "newest";

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

function authorKey(name) {
  return String(name || "").trim();
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className={styles.filterControl}>
      <span className={styles.visuallyHidden}>{label}</span>
      <select
        className={styles.filterSelect}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
      >
        {children}
      </select>
    </label>
  );
}

function SubscribeCard({ order }) {
  return (
    <HideWhenSubscribed>
      <article className={styles.issueCard} style={{ order }}>
        <div className={styles.issueCardPlaceholder}>
          <div className={styles.issueCardBody}>
            <h3>More articles coming soon</h3>
            <p className={styles.issueDek}>
              New articles drop weekly. Subscribe to get them in your inbox.
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
          <p className={styles.issueDate}>{originalCardLabel(issue) || "—"}</p>
          <h3>{issue.title}</h3>
          {issue.authorName ? <p className={styles.issueAuthor}>{issue.authorName}</p> : null}
          {issue.summary ? <p className={styles.issueDek}>{issue.summary}</p> : null}
          <span className={styles.issueCta}>Read article</span>
        </div>
      </Link>
    </article>
  );
}

/**
 * Client-side archive search, filters, and sort. State lives in the URL
 * (`q`, `issue`, `year`, `author`, `sort`) so views are shareable.
 */
export default function ArchiveBrowser({ issues }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = (searchParams.get("q") || "").trim();
  const queryNormalized = query.toLowerCase();
  const issueFilterParam = (searchParams.get("issue") || "").trim();
  const yearFilterParam = (searchParams.get("year") || "").trim();
  const issueFilterNum = Number(issueFilterParam);
  const yearFilterNum = Number(yearFilterParam);
  const issueFilter =
    issueFilterParam && Number.isFinite(issueFilterNum) ? String(issueFilterNum) : issueFilterParam;
  const yearFilter =
    yearFilterParam && Number.isFinite(yearFilterNum) ? String(yearFilterNum) : yearFilterParam;
  const authorFilter = (searchParams.get("author") || "").trim();
  const SORTS = new Set(["newest", "oldest", "issue-desc", "issue-asc", "author"]);
  const sortRaw = (searchParams.get("sort") || DEFAULT_SORT).trim() || DEFAULT_SORT;
  const sort = SORTS.has(sortRaw) ? sortRaw : DEFAULT_SORT;
  const [searchDraft, setSearchDraft] = useState(query);

  const replaceParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "" || (key === "sort" && value === DEFAULT_SORT)) {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }
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
      replaceParams({ q: trimmed });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query, replaceParams]);

  const issueNumbers = useMemo(() => {
    const set = new Set();
    for (const issue of issues) {
      const n = originalIssueNumber(issue);
      if (n != null) set.add(n);
    }
    return [...set].sort((a, b) => a - b);
  }, [issues]);

  const years = useMemo(() => {
    const set = new Set();
    for (const issue of issues) {
      const y = originalYearValue(issue);
      if (y != null) set.add(y);
    }
    return [...set].sort((a, b) => b - a);
  }, [issues]);

  const authorOptions = useMemo(() => {
    const byKey = new Map();
    for (const issue of issues) {
      const name = authorKey(issue.authorName);
      if (!name) continue;
      const key = name.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, name);
    }
    return [...byKey.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [issues]);

  const searchable = useMemo(
    () =>
      issues.map((issue) => ({
        issue,
        titleText: String(issue.title || "").toLowerCase(),
        dekText: String(issue.summary || "").toLowerCase(),
      })),
    [issues],
  );

  const hasActiveFilters = Boolean(queryNormalized || issueFilter || yearFilter || authorFilter);

  const visible = useMemo(() => {
    const tokens = queryNormalized ? queryTokens(queryNormalized) : [];
    const issueNum = issueFilter ? Number(issueFilter) : null;
    const yearNum = yearFilter ? Number(yearFilter) : null;
    const authorNorm = authorFilter.toLowerCase();

    const matched = searchable.filter(({ issue }) => {
      if (tokens.length && !tokens.every((token) => issue.searchText.includes(token))) {
        return false;
      }
      if (issueNum != null && Number.isFinite(issueNum) && originalIssueNumber(issue) !== issueNum) {
        return false;
      }
      if (yearNum != null && Number.isFinite(yearNum) && originalYearValue(issue) !== yearNum) {
        return false;
      }
      if (authorNorm && authorKey(issue.authorName).toLowerCase() !== authorNorm) {
        return false;
      }
      return true;
    });

    if (tokens.length) {
      return matched.sort((a, b) => compareSearchResults(a, b, tokens, sort)).map(({ issue }) => issue);
    }
    return matched.map(({ issue }) => issue).sort((a, b) => compareVaultSort(a, b, sort));
  }, [searchable, queryNormalized, issueFilter, yearFilter, authorFilter, sort]);

  const columns = useMemo(() => {
    const entries = visible.map((issue) => ({ issue, aspect: imageAspect(issue) }));
    if (!hasActiveFilters) entries.push({ issue: null, aspect: 0.4 });
    return packColumns(entries);
  }, [visible, hasActiveFilters]);

  const emptyMessage = query
    ? `No articles match “${query}”. Try a different search or filter.`
    : "No articles match these filters. Try a different combination.";

  return (
    <div className={isPending ? styles.browserPending : undefined}>
      <div className={styles.filterBar}>
        <label className={styles.searchControl}>
          <span className={styles.visuallyHidden}>Search articles</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search articles…"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            autoComplete="off"
          />
        </label>
        <FilterSelect
          label="Filter by magazine issue"
          value={issueFilter}
          onChange={(value) => replaceParams({ issue: value })}
        >
          <option value="">All issues</option>
          {issueFilter && !issueNumbers.includes(Number(issueFilter)) ? (
            <option value={issueFilter}>Issue {issueFilter}</option>
          ) : null}
          {issueNumbers.map((n) => (
            <option key={n} value={String(n)}>
              Issue {n}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Filter by year"
          value={yearFilter}
          onChange={(value) => replaceParams({ year: value })}
        >
          <option value="">All years</option>
          {yearFilter && !years.includes(Number(yearFilter)) ? (
            <option value={yearFilter}>{yearFilter}</option>
          ) : null}
          {years.map((y) => (
            <option key={y} value={String(y)}>
              {y}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Filter by author"
          value={
            authorOptions.find((name) => name.toLowerCase() === authorFilter.toLowerCase()) ||
            authorFilter
          }
          onChange={(value) => replaceParams({ author: value })}
        >
          <option value="">All authors</option>
          {authorFilter &&
          !authorOptions.some((name) => name.toLowerCase() === authorFilter.toLowerCase()) ? (
            <option value={authorFilter}>{authorFilter}</option>
          ) : null}
          {authorOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Sort articles"
          value={sort}
          onChange={(value) => replaceParams({ sort: value })}
        >
          <option value="newest">Newest print first</option>
          <option value="oldest">Oldest print first</option>
          <option value="issue-desc">Issue # high to low</option>
          <option value="issue-asc">Issue # low to high</option>
          <option value="author">Author A–Z</option>
        </FilterSelect>
      </div>

      {visible.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
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
