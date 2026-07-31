import Link from "next/link";
import {
  getArticles,
  getDemographicAndDescription,
  bodyExcerptFromArticle,
} from "@/lib/articles";
import SanityMedia from "@/components/SanityMedia";
import SubscribeBlock from "@/components/SubscribeBlock";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import HomeSnippetsList from "@/components/HomeSnippetsList";
import HomeAboutSection from "@/components/HomeAboutSection";
import HomeSubscribeSection from "@/components/HomeSubscribeSection";
import JsonLd from "@/components/JsonLd";
import {
  siteConfig,
  siteDefaultDescription,
  siteDisplayName,
  siteHeroTagline,
} from "@/config/site";
import styles from "./page.module.css";

const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || siteDefaultDescription;
const SITE_OG_IMAGE_PATH =
  process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/tnp-photo.gif";

function absoluteSiteUrl(path) {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Atlantic-style: 1 center, 2 left, N in right stack. No article repeated. */
const LEFT_COUNT = 2;
/** Max items for "More issues" (client shows 3 when signed out, 6 when signed in). */
const STACK_COUNT_MAX = 6;

function paragraphsFromPortableTextBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((block) => {
      if (!Array.isArray(block?.children)) return "";
      return block.children
        .map((child) => (typeof child?.text === "string" ? child.text : ""))
        .join("")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter(Boolean);
}

function firstWordsWithEllipsis(text, wordCount = 150) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.split(" ");
  if (words.length <= wordCount) return clean;
  return `${words.slice(0, wordCount).join(" ")}…`;
}

/** Opening body paragraphs for featured cards, preserving article paragraph breaks. */
function featuredPreviewParagraphsFromArticle(article, wordCount = 150) {
  const sections = Array.isArray(article?.contentBlocks) ? article.contentBlocks : [];
  const paragraphs = sections.flatMap((section) =>
    paragraphsFromPortableTextBlocks(section?.body),
  );
  if (paragraphs.length === 0) {
    const fallback = (article?.summary || article?.subtitle || "").trim();
    return fallback ? [firstWordsWithEllipsis(fallback, wordCount)] : [];
  }

  const out = [];
  let wordsUsed = 0;
  for (const para of paragraphs) {
    if (wordsUsed >= wordCount) break;
    const words = para.split(/\s+/).filter(Boolean);
    const remaining = wordCount - wordsUsed;
    if (words.length <= remaining) {
      out.push(para);
      wordsUsed += words.length;
    } else {
      out.push(`${words.slice(0, remaining).join(" ")}…`);
      break;
    }
  }
  return out;
}

function MosaicCardBody({ article }) {
  const { demographic, description } = getDemographicAndDescription(article);
  const excerpt = bodyExcerptFromArticle(article, 2);
  return (
    <div className={styles.mosaicCardBody}>
      <h3 className={styles.mosaicCardHeadline}>{article.title}</h3>
      {demographic ? (
        <p className={styles.mosaicCardDemographic}>{demographic}</p>
      ) : null}
      {description ? <p className={styles.mosaicCardDek}>{description}</p> : null}
      {excerpt ? <p className={styles.mosaicCardExcerpt}>{excerpt}</p> : null}
    </div>
  );
}

export default async function Home({ searchParams: searchParamsProp }) {
  const searchParams = typeof searchParamsProp?.then === "function" ? await searchParamsProp : searchParamsProp ?? {};
  const initialEmail = searchParams?.email ? decodeURIComponent(String(searchParams.email)) : undefined;

  const articles = await getArticles();
  const totalCount = articles.length;

  const featured = articles[0] ?? null;
  const leftCards = articles.slice(1, 1 + LEFT_COUNT);
  const stackItems = articles.slice(1 + LEFT_COUNT, 1 + LEFT_COUNT + STACK_COUNT_MAX);
  const remainingArticles = articles.slice(1 + LEFT_COUNT + STACK_COUNT_MAX);
  // Side columns share medium cards; center featured count scales with archive (~1/5).
  const remainingCount = remainingArticles.length;
  const archiveCenterCount = Math.max(1, Math.round(remainingCount / 5));
  const sideTotal = remainingCount - archiveCenterCount;
  const archiveLeftCount = Math.ceil(sideTotal / 2);
  const archiveLeft = remainingArticles.slice(0, archiveLeftCount);
  const archiveCenter = remainingArticles.slice(
    archiveLeftCount,
    archiveLeftCount + archiveCenterCount,
  );
  const archiveRight = remainingArticles.slice(archiveLeftCount + archiveCenterCount);
  const featuredDemographic = featured ? getDemographicAndDescription(featured).demographic : "";

  const homeUrl = absoluteSiteUrl("/");
  const ogImageUrl = absoluteSiteUrl(SITE_OG_IMAGE_PATH);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteDisplayName,
    url: homeUrl,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: {
      "@type": "Organization",
      name: siteDisplayName,
      url: homeUrl,
      logo: ogImageUrl,
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteDisplayName,
    url: homeUrl,
    logo: ogImageUrl,
    description: SITE_DESCRIPTION,
    parentOrganization: {
      "@type": "Organization",
      name: "Unaffiliated Inc.",
      url: "https://unaffiliated.co",
    },
  };

  return (
    <div className={styles.page}>
      <JsonLd data={websiteJsonLd} />
      <JsonLd data={organizationJsonLd} />
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
                    <SanityMedia
                      src={article.mainImage}
                      alt={article.title}
                      width={400}
                      height={267}
                      sizes="(max-width: 900px) 100vw, 320px"
                    />
                  </div>
                  <MosaicCardBody article={article} />
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
                  <SanityMedia
                    src={featured.mainImage}
                    alt={featured.title}
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
                    const paragraphs = featuredPreviewParagraphsFromArticle(featured);
                    return paragraphs.length > 0 ? (
                      <div className={styles.featuredEntryPreview}>
                        {paragraphs.map((para, index) => (
                          <p className={styles.featuredEntrySnippet} key={index}>
                            {para}
                          </p>
                        ))}
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

      {/* Second mosaic: left medium | center featured | right snippets */}
      {remainingArticles.length > 0 ? (
        <section className={styles.mosaic} aria-label="More issues">
          <div
            className={`${styles.mosaicContainer} ${styles.mosaicContainerSubscribeLeft}`}
          >
            <div className={styles.mosaicLeft}>
              {archiveLeft.map((article) => (
                <article className={styles.mosaicCard} key={article._id ?? article.slug}>
                  <Link
                    href={`/article/${article.slug}`}
                    className={styles.mosaicCardLink}
                  >
                    <div className={styles.mosaicCardImage}>
                      <SanityMedia
                        src={article.mainImage}
                        alt={article.title}
                        width={400}
                        height={267}
                        sizes="(max-width: 900px) 100vw, 320px"
                      />
                    </div>
                    <MosaicCardBody article={article} />
                  </Link>
                </article>
              ))}
            </div>

            <div className={styles.mosaicCenter}>
              <div className={styles.archiveIssueColumn}>
                {archiveCenter.map((article) => {
                  const { demographic } = getDemographicAndDescription(article);
                  const paragraphs = featuredPreviewParagraphsFromArticle(article, 280);
                  return (
                    <Link
                      key={article._id ?? article.slug}
                      href={`/article/${article.slug}`}
                      className={`${styles.featuredCard} ${styles.archiveFeaturedCard}`}
                    >
                      <div className={styles.featuredImage}>
                        <SanityMedia
                          src={article.mainImage}
                          alt={article.title}
                          width={article.mainImageWidth || 900}
                          height={article.mainImageHeight || 600}
                          sizes="(max-width: 900px) 100vw, 560px"
                        />
                      </div>
                      <div className={styles.featuredBody}>
                        <h2 className={styles.featuredHeadline}>{article.title}</h2>
                        {demographic ? (
                          <p className={styles.featuredDek}>{demographic}</p>
                        ) : null}
                        {paragraphs.length > 0 ? (
                          <div className={styles.featuredEntryPreview}>
                            {paragraphs.map((para, index) => (
                              <p className={styles.featuredEntrySnippet} key={index}>
                                {para}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        <span className={styles.featuredLink}>Read more</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={`${styles.mosaicRight} ${styles.archiveMosaicRight}`}>
              {archiveRight.map((article) => (
                <article className={styles.mosaicCard} key={article._id ?? article.slug}>
                  <Link
                    href={`/article/${article.slug}`}
                    className={styles.mosaicCardLink}
                  >
                    <div className={styles.mosaicCardImage}>
                      <SanityMedia
                        src={article.mainImage}
                        alt={article.title}
                        width={400}
                        height={267}
                        sizes="(max-width: 900px) 100vw, 320px"
                      />
                    </div>
                    <MosaicCardBody article={article} />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <HomeSubscribeSection
        initialEmail={initialEmail}
        accentBand={remainingArticles.length === 0}
      />
    </div>
  );
}
