"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { bodyExcerptFromArticle, searchTextFromArticle } from "@/lib/articles";
import { ARCHIVE_THEMES, ARCHIVE_THEME_BY_SLUG } from "@/config/themes";
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
          {excerpt ? <p className={styles.issueDek}>{excerpt}</p> : null}
          <span className={styles.issueCta}>Read issue</span>
        </div>
      </Link>
    </article>
  );
}

/**
 * Client-side theme filter (multi-select, OR) and search.
 * State lives in query params (?category=&q=) so filtered views are shareable.
 */
export default function ArchiveBrowser({ articles }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedThemes = useMemo(() => {
    const raw = searchParams.getAll("category").flatMap((value) => value.split(","));
    const valid = new Set(ARCHIVE_THEMES.map((theme) => theme.slug));
    return [...new Set(raw.map((value) => value.trim()).filter((value) => valid.has(value)))];
  }, [searchParams]);

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

  const setThemes = (next) => {
    replaceParams((params) => {
      params.delete("category");
      for (const slug of next) params.append("category", slug);
    });
  };

  const toggleTheme = (slug) => {
    if (selectedThemes.includes(slug)) {
      setThemes(selectedThemes.filter((value) => value !== slug));
    } else {
      setThemes([...selectedThemes, slug]);
    }
  };

  const clearThemes = () => setThemes([]);

  const usedThemeSlugs = useMemo(() => {
    const set = new Set();
    for (const article of articles) {
      for (const theme of article.themes || []) {
        if (ARCHIVE_THEME_BY_SLUG[theme]) set.add(theme);
      }
    }
    return set;
  }, [articles]);

  const visibleThemes = ARCHIVE_THEMES.filter((theme) => usedThemeSlugs.has(theme.slug));

  const searchableArticles = useMemo(
    () =>
      articles.map((article) => {
        const themeTitles = (article.themes || [])
          .map((slug) => ARCHIVE_THEME_BY_SLUG[slug]?.title)
          .filter(Boolean)
          .join(" ");
        const haystack = `${searchTextFromArticle(article)} ${themeTitles}`.trim();
        const titleText = String(article.title || "").toLowerCase();
        const dekText = String(bodyExcerptFromArticle(article, 2) || article.subtitle || "").toLowerCase();
        return { article, haystack, titleText, dekText };
      }),
    [articles],
  );

  const visible = useMemo(() => {
    let list = searchableArticles;
    if (selectedThemes.length > 0) {
      list = list.filter(({ article }) =>
        (article.themes || []).some((theme) => selectedThemes.includes(theme)),
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
  }, [searchableArticles, selectedThemes, queryNormalized]);

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

      {visibleThemes.length > 0 ? (
        <div className={styles.filterChips} role="group" aria-label="Filter by theme">
          <button
            type="button"
            className={`${styles.filterChip} ${selectedThemes.length === 0 ? styles.filterChipActive : ""}`}
            onClick={clearThemes}
            aria-pressed={selectedThemes.length === 0}
          >
            All
          </button>
          {visibleThemes.map((theme) => {
            const active = selectedThemes.includes(theme.slug);
            return (
              <button
                key={theme.slug}
                type="button"
                className={`${styles.filterChip} ${active ? styles.filterChipActive : ""}`}
                onClick={() => toggleTheme(theme.slug)}
                aria-pressed={active}
                title={theme.description}
              >
                {theme.title}
              </button>
            );
          })}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className={styles.emptyState}>
          No issues match{query ? ` “${query}”` : " these filters"}. Try clearing a theme or
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
