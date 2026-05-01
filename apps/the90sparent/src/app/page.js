import Image from "next/image";
import Link from "next/link";
import {
  getArticles,
  getDemographicAndDescription,
} from "@/lib/articles";
import SubscribeBlock from "@/components/SubscribeBlock";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import HomeSnippetsList from "@/components/HomeSnippetsList";
import HomeAboutSection from "@/components/HomeAboutSection";
import { siteHeroTagline, siteKickerLower } from "@/config/site";
import styles from "./page.module.css";

/** Atlantic-style: 1 center, 2 left, N in right stack. No article repeated. */
const LEFT_COUNT = 2;
/** Max items for "More issues" (client shows 3 when signed out, 6 when signed in). */
const STACK_COUNT_MAX = 6;

function plainTextFromPortableTextBlocks(blocks) {
  if (!Array.isArray(blocks)) return "";
  return blocks
    .flatMap((block) => {
      if (!Array.isArray(block?.children)) return [];
      return block.children
        .map((child) => (typeof child?.text === "string" ? child.text : ""))
        .filter(Boolean);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstWordsWithEllipsis(text, wordCount = 150) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.split(" ");
  if (words.length <= wordCount) return clean;
  return `${words.slice(0, wordCount).join(" ")}…`;
}

function featuredPreviewFromArticle(article) {
  const sections = Array.isArray(article?.contentBlocks) ? article.contentBlocks : [];
  const bodyText = sections
    .map((section) => plainTextFromPortableTextBlocks(section?.body))
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = (article?.summary || article?.subtitle || "").trim();
  return firstWordsWithEllipsis(bodyText || fallback, 150);
}

export default async function Home({ searchParams: searchParamsProp }) {
  const searchParams = typeof searchParamsProp?.then === "function" ? await searchParamsProp : searchParamsProp ?? {};
  const initialEmail = searchParams?.email ? decodeURIComponent(String(searchParams.email)) : undefined;

  const articles = await getArticles();
  const totalCount = articles.length;

  const featured = articles[0] ?? null;
  const leftCards = articles.slice(1, 1 + LEFT_COUNT);
  const stackItems = articles.slice(1 + LEFT_COUNT, 1 + LEFT_COUNT + STACK_COUNT_MAX);
  const featuredDemographic = featured ? getDemographicAndDescription(featured).demographic : "";

  return (
    <div className={styles.page}>
      {/* Hero line */}
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.heroTagline}>{siteHeroTagline}</p>
          {totalCount > 0 && (
            <p className={styles.heroMeta}>
              {totalCount} article{totalCount !== 1 ? "s" : ""} in the archive
              <HideWhenSubscribed>
                <>
                  {" · "}
                  <a href="/#subscribe">Get the next one in your inbox</a>
                </>
              </HideWhenSubscribed>
            </p>
          )}
        </div>
      </section>

      {/* Atlantic mosaic: 2 left | 1 center | right stack + subscribe */}
      <section className={styles.mosaic} id="subscribe">
        <div className={styles.mosaicContainer}>
          {/* Left column: exactly two cards */}
          <div className={styles.mosaicLeft}>
            {leftCards.map((article) => (
              <article className={styles.mosaicCard} key={article._id ?? article.slug}>
                <Link
                  href={`/article/${article.slug}`}
                  className={styles.mosaicCardLink}
                >
                  <div className={styles.mosaicCardImage}>
                    <Image
                      src={article.mainImage}
                      alt=""
                      width={400}
                      height={267}
                      sizes="(max-width: 900px) 100vw, 320px"
                    />
                  </div>
                  <div className={styles.mosaicCardBody}>
                    {article.kicker && article.kicker.trim().toLowerCase() !== siteKickerLower && (
                      <p className={styles.mosaicCardKicker}>{article.kicker}</p>
                    )}
                    <h3 className={styles.mosaicCardHeadline}>{article.title}</h3>
                    {(() => {
                      const { demographic, description } = getDemographicAndDescription(article);
                      return (
                        <>
                          {demographic && (
                            <p className={styles.mosaicCardDemographic}>{demographic}</p>
                          )}
                          {description && (
                            <p className={styles.mosaicCardDek}>{description}</p>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* Center: one featured */}
          <div className={styles.mosaicCenter}>
            {featured && (
              <Link
                href={`/article/${featured.slug}`}
                className={styles.featuredCard}
              >
                <div className={styles.featuredImage}>
                  <Image
                    src={featured.mainImage}
                    alt=""
                    width={featured.mainImageWidth || 900}
                    height={featured.mainImageHeight || 600}
                    priority
                    sizes="(max-width: 900px) 100vw, 560px"
                  />
                </div>
                <div className={styles.featuredBody}>
                  <p className={styles.featuredKicker}>Latest issue</p>
                  <h2 className={styles.featuredHeadline}>{featured.title}</h2>
                  {featuredDemographic && (
                    <p className={styles.featuredDek}>{featuredDemographic}</p>
                  )}
                  {(() => {
                    const preview = featuredPreviewFromArticle(featured);
                    return preview ? (
                      <div className={styles.featuredEntryPreview}>
                        <p className={styles.featuredEntrySnippet}>{preview}</p>
                      </div>
                    ) : null;
                  })()}
                  <span className={styles.featuredLink}>Read more</span>
                </div>
              </Link>
            )}
          </div>

          {/* Right column: stack (snippets with thumb) then subscribe at bottom */}
          <div className={styles.mosaicRight}>
            <HideWhenSubscribed>
              <SubscribeBlock initialEmail={initialEmail} />
            </HideWhenSubscribed>
            <HomeSnippetsList stackItems={stackItems} />
          </div>
        </div>
      </section>

      {/* More about (always visible; copy and Subscribe link vary by sign-in) */}
      <HomeAboutSection totalCount={totalCount} />
    </div>
  );
}
