"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { bodyExcerptFromArticle, searchTextFromArticle } from "@/lib/articles";
import styles from "@/app/archive/page.module.css";

function publishedTime(article) {
  if (!article?.publishedDate) return null;
  const t = new Date(article.publishedDate).getTime();
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

function articleMatchesQuery(haystack, tokens) {
  if (!tokens.length) return true;
  return tokens.every((token) => haystack.includes(token));
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

/**
 * Search rank: title token hits → dek token hits → full-text occurrences → publish date.
 * Higher title/dek/occurrence wins; then newest.
 */
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
    occA += countOccurrences(a.haystack, token);
    occB += countOccurrences(b.haystack, token);
  }

  if (titleA !== titleB) return titleB - titleA;
  if (dekA !== dekB) return dekB - dekA;
  if (occA !== occB) return occB - occA;
  return sortByPublishedDateDesc(a.article, b.article);
}

function IssueCard({ article }) {
  const excerpt = bodyExcerptFromArticle(article, 2);
  return (
    <article className={styles.issueCard}>
      <Link href={`/article/${article.slug}`} className={styles.issueCardLink}>
        <div className={styles.issueCardImage}>
          <Image
            src={article.mainImage}
            alt={article.title}
            width={400}
            height={267}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className={styles.issueCardBody}>
          <p className={styles.issueDate}>
            {article.publishedDate
              ? new Date(article.publishedDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
          <h3>{article.title}</h3>
          {article.subjectName ? (
            <p className={styles.issueSubject}>{article.subjectName}</p>
          ) : null}
          {excerpt ? <p className={styles.issueExcerpt}>{excerpt}</p> : null}
          <span className={styles.issueCta}>
            <span>Read issue</span>
            <span className={styles.issueCtaArrow} aria-hidden>
              <svg width="7" height="6" viewBox="0 0 7 6" fill="none" role="presentation" focusable="false">
                <path
                  d="M0 2.91722H6.01145M6.01145 2.91722L3.44774 0.353516M6.01145 2.91722L3.44774 5.48093"
                  stroke="currentColor"
                />
              </svg>
            </span>
          </span>
        </div>
      </Link>
    </article>
  );
}

/**
 * Client-side search only (no category chips — under 16 issues).
 * State lives in the query param (?q=) so filtered views are shareable.
 */
export default function ArchiveBrowser({ articles }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = (searchParams.get("q") || "").trim();
  const queryNormalized = query.toLowerCase();
  const [searchDraft, setSearchDraft] = useState(query);

  const replaceParams = useCallback(
    (mutate) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
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
      if (searchDraft.trim() === query) return;
      replaceParams((params) => {
        const trimmed = searchDraft.trim();
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
      });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchDraft, query, replaceParams]);

  const searchableArticles = useMemo(
    () =>
      articles.map((article) => {
        const haystack = searchTextFromArticle(article);
        const titleText = String(article.title || "").toLowerCase();
        const dekText = String(bodyExcerptFromArticle(article, 2) || article.subtitle || "").toLowerCase();
        return { article, haystack, titleText, dekText };
      }),
    [articles],
  );

  const visible = useMemo(() => {
    if (!queryNormalized) {
      return searchableArticles.map(({ article }) => article).sort(sortByPublishedDateDesc);
    }
    const tokens = queryTokens(queryNormalized);
    const list = searchableArticles.filter(({ haystack }) => articleMatchesQuery(haystack, tokens));
    return [...list]
      .sort((a, b) => compareSearchResults(a, b, tokens))
      .map(({ article }) => article);
  }, [searchableArticles, queryNormalized]);

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
          No issues match{query ? ` “${query}”` : " that search"}. Try a different term.
        </p>
      ) : (
        <div className={styles.issueMosaic}>
          {visible.map((article) => (
            <IssueCard key={article._id ?? article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
