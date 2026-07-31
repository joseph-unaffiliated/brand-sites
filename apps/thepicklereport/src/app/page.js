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
import HomeHeroTagline from "@/components/HomeHeroTagline";
import HomeSubscribeSection from "@/components/HomeSubscribeSection";
import JsonLd from "@/components/JsonLd";
import {
  siteConfig,
  siteDefaultDescription,
  siteDisplayName,
} from "@/config/site";
import styles from "./page.module.css";

const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || siteDefaultDescription;
const SITE_OG_IMAGE_PATH =
  process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/tpr-photo.png";

function absoluteSiteUrl(path) {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Atlantic-style: 2 center, 4 left, N in right stack. No article repeated. */
const CENTER_COUNT = 2;
const LEFT_COUNT = 4;
/** Max items for "More issues" (client shows 2 when signed out, 5 when signed in). */
const STACK_COUNT_MAX = 5;

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

  const featuredArticles = articles.slice(0, CENTER_COUNT);
  const leftCards = articles.slice(CENTER_COUNT, CENTER_COUNT + LEFT_COUNT);
  const stackItems = articles.slice(
    CENTER_COUNT + LEFT_COUNT,
    CENTER_COUNT + LEFT_COUNT + STACK_COUNT_MAX,
  );
  const remainingArticles = articles.slice(CENTER_COUNT + LEFT_COUNT + STACK_COUNT_MAX);
  // Second mosaic: left/center/right split; center scales with archive (~1/5 of remaining).
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
    <>
      <HomeHeroTagline />
      <div className={styles.page}>
        <JsonLd data={websiteJsonLd} />
        <JsonLd data={organizationJsonLd} />
        <section className={styles.hero}>
          <div className="container">
            {totalCount > 0 && (
              <p className={styles.heroMeta}>
                {totalCount} issue{totalCount !== 1 ? "s" : ""} in the archive
                <HideWhenSubscribed>
                  <>
                    {" • "}
                    <a href="/#subscribe">Get the next one in your inbox</a>
                  </>
                </HideWhenSubscribed>
              </p>
            )}
          </div>
        </section>

        {/* Atlantic mosaic: 4 left | 2 center | right stack + subscribe */}
        <section className={styles.mosaic} id="subscribe">
        <div className={styles.mosaicContainer}>
          {/* Left column */}
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

          {/* Center: featured issues (fill height set by left rail) */}
          <div className={styles.mosaicCenter}>
            <div className={styles.featuredIssueColumn}>
              {featuredArticles.map((article, index) => {
                const { demographic } = getDemographicAndDescription(article);
                const preview = featuredPreviewFromArticle(article);
                return (
                  <Link
                    key={article._id ?? article.slug}
                    href={`/article/${article.slug}`}
                    className={`${styles.featuredCard} ${styles.featuredFillCard}`}
                  >
                    <div className={styles.featuredImage}>
                      <Image
                        src={article.mainImage}
                        alt=""
                        width={article.mainImageWidth || 900}
                        height={article.mainImageHeight || 600}
                        priority={index === 0}
                        sizes="(max-width: 900px) 100vw, 560px"
                      />
                    </div>
                    <div className={styles.featuredBody}>
                      {index === 0 && (
                        <p className={styles.featuredKicker}>Latest issue</p>
                      )}
                      <h2 className={styles.featuredHeadline}>{article.title}</h2>
                      {demographic && (
                        <p className={styles.featuredDek}>{demographic}</p>
                      )}
                      {preview ? (
                        <div className={styles.featuredEntryPreview}>
                          <p className={styles.featuredEntrySnippet}>{preview}</p>
                        </div>
                      ) : null}
                      <span className={styles.featuredLink}>Read more</span>
                    </div>
                  </Link>
                );
              })}
            </div>
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

      {/* Second mosaic: left medium | center featured | right medium (equal rails) */}
      {remainingArticles.length > 0 ? (
        <section className={styles.mosaic} aria-label="More issues">
          <div
            className={`${styles.mosaicContainer} ${styles.mosaicContainerSubscribeLeft}`}
          >
            <div className={styles.mosaicLeft}>
              {archiveLeft.map((article) => (
                <article className={styles.mosaicCard} key={article._id ?? article.slug}>
                  <Link href={`/article/${article.slug}`} className={styles.mosaicCardLink}>
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

            <div className={styles.mosaicCenter}>
              <div className={styles.archiveIssueColumn}>
                {archiveCenter.map((article) => {
                  const { demographic } = getDemographicAndDescription(article);
                  const preview = featuredPreviewFromArticle(article);
                  return (
                    <Link
                      key={article._id ?? article.slug}
                      href={`/article/${article.slug}`}
                      className={`${styles.featuredCard} ${styles.archiveFeaturedCard}`}
                    >
                      <div className={styles.featuredImage}>
                        <Image
                          src={article.mainImage}
                          alt=""
                          width={article.mainImageWidth || 900}
                          height={article.mainImageHeight || 600}
                          sizes="(max-width: 900px) 100vw, 560px"
                        />
                      </div>
                      <div className={styles.featuredBody}>
                        <h2 className={styles.featuredHeadline}>{article.title}</h2>
                        {demographic && <p className={styles.featuredDek}>{demographic}</p>}
                        {preview ? (
                          <div className={styles.featuredEntryPreview}>
                            <p className={styles.featuredEntrySnippet}>{preview}</p>
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
                  <Link href={`/article/${article.slug}`} className={styles.mosaicCardLink}>
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
          </div>
        </section>
      ) : null}

      <HomeSubscribeSection
        initialEmail={initialEmail}
        accentBand={remainingArticles.length === 0}
      />
    </div>
    </>
  );
}
