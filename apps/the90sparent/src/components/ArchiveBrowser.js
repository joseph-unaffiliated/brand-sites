"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SanityMedia from "@/components/SanityMedia";
import { ensureDescriptionOnly, searchTextFromArticle } from "@/lib/article-helpers";
import { ARCHIVE_CATEGORIES, ARCHIVE_CATEGORY_BY_SLUG } from "@/config/categories";
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
  return (
    <article className={styles.issueCard}>
      <Link href={`/article/${article.slug}`} className={styles.issueCardLink}>
        <div className={styles.issueCardImage}>
          <SanityMedia
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
          <p className={styles.issueDek}>
            {ensureDescriptionOnly(article.summary || article.subtitle) ||
              article.summary ||
              article.subtitle}
          </p>
          <span className={styles.issueCta}>
            <span>Read issue</span>
            <span className={styles.issueCtaArrow} aria-hidden>
              <svg
                width="7"
                height="6"
                viewBox="0 0 7 6"
                fill="none"
                role="presentation"
                focusable="false"
              >
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
 * Client-side category filter (multi-select, OR) and search.
 * State lives in query params (?category=&q=) so filtered views are shareable.
 */
export default function ArchiveBrowser({ articles }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedCategories = useMemo(() => {
    const raw = searchParams.getAll("category").flatMap((value) => value.split(","));
    const valid = new Set(ARCHIVE_CATEGORIES.map((category) => category.slug));
    return [...new Set(raw.map((value) => value.trim()).filter((value) => valid.has(value)))];
  }, [searchParams]);

  const query = (searchParams.get("q") || "").trim();
  const queryNormalized = query.toLowerCase();
  const [searchDraft, setSearchDraft] = useState(query);

  const replaceParams = useCallback(
    (mutate) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      params.delete("sort");
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

  const setCategories = (next) => {
    replaceParams((params) => {
      params.delete("category");
      for (const slug of next) params.append("category", slug);
    });
  };

  const toggleCategory = (slug) => {
    if (selectedCategories.includes(slug)) {
      setCategories(selectedCategories.filter((value) => value !== slug));
    } else {
      setCategories([...selectedCategories, slug]);
    }
  };

  const clearCategories = () => setCategories([]);

  const usedCategorySlugs = useMemo(() => {
    const set = new Set();
    for (const article of articles) {
      for (const tag of article.tags || []) {
        if (ARCHIVE_CATEGORY_BY_SLUG[tag]) set.add(tag);
      }
    }
    return set;
  }, [articles]);

  const visibleCategories = ARCHIVE_CATEGORIES.filter((category) =>
    usedCategorySlugs.has(category.slug),
  );

  const searchableArticles = useMemo(
    () =>
      articles.map((article) => {
        const categoryTitles = (article.tags || [])
          .map((slug) => ARCHIVE_CATEGORY_BY_SLUG[slug]?.title)
          .filter(Boolean)
          .join(" ");
        const haystack = `${searchTextFromArticle(article)} ${categoryTitles}`.trim();
        const titleText = String(article.title || "").toLowerCase();
        const dekText = String(
          ensureDescriptionOnly(article.summary || article.subtitle) ||
            article.summary ||
            article.subtitle ||
            "",
        ).toLowerCase();
        return { article, haystack, titleText, dekText };
      }),
    [articles],
  );

  const visible = useMemo(() => {
    let list = searchableArticles;
    if (selectedCategories.length > 0) {
      list = list.filter(({ article }) =>
        (article.tags || []).some((tag) => selectedCategories.includes(tag)),
      );
    }

    if (!queryNormalized) {
      return list.map(({ article }) => article).sort(sortByPublishedDateDesc);
    }

    const tokens = queryTokens(queryNormalized);
    list = list.filter(({ haystack }) => articleMatchesQuery(haystack, tokens));
    return [...list]
      .sort((a, b) => compareSearchResults(a, b, tokens))
      .map(({ article }) => article);
  }, [searchableArticles, selectedCategories, queryNormalized]);

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

      {visibleCategories.length > 0 ? (
        <div className={styles.filterChips} role="group" aria-label="Filter by category">
          <button
            type="button"
            className={`${styles.filterChip} ${selectedCategories.length === 0 ? styles.filterChipActive : ""}`}
            onClick={clearCategories}
            aria-pressed={selectedCategories.length === 0}
          >
            All
          </button>
          {visibleCategories.map((category) => {
            const active = selectedCategories.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
                onClick={() => toggleCategory(category.slug)}
                aria-pressed={active}
                title={category.description}
              >
                {category.title}
              </button>
            );
          })}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className={styles.emptyState}>
          No issues match{query ? ` “${query}”` : " these filters"}. Try clearing a category or
          search term.
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
