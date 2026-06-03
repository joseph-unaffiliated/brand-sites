import Link from "next/link";
import SanityMedia from "@/components/SanityMedia";
import {
  getArticles,
  getDemographicAndDescription,
} from "@/lib/articles";
import SubscribeBlock from "@/components/SubscribeBlock";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import HomeSnippetsList from "@/components/HomeSnippetsList";
import HomeAboutSection from "@/components/HomeAboutSection";
import HomeHeroTagline from "@/components/HomeHeroTagline";
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
  process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/tkat-phone.png";

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

function firstWordsWithEllipsis(text, wordCount = 150) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.split(" ");
  if (words.length <= wordCount) return clean;
  return `${words.slice(0, wordCount).join(" ")}…`;
}

function featuredPreviewFromArticle(article) {
  const entries = Array.isArray(article?.entries) ? article.entries : [];
  const firstBody = entries.find((entry) => typeof entry?.body === "string" && entry.body.trim())?.body ?? "";
  const fallback = (article?.summary || article?.subtitle || "").trim();
  return firstWordsWithEllipsis(firstBody || fallback, 220);
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

        <section className={styles.mosaic} id="subscribe">
        <div className={styles.mosaicContainer}>
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
            {featuredArticles.map((article, index) => {
              const { demographic } = getDemographicAndDescription(article);
              const preview = featuredPreviewFromArticle(article);
              return (
                <Link
                  key={article._id ?? article.slug}
                  href={`/article/${article.slug}`}
                  className={styles.featuredCard}
                >
                  <div className={styles.featuredImage}>
                    <SanityMedia
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

          <div className={styles.mosaicRight}>
            <HideWhenSubscribed>
              <SubscribeBlock initialEmail={initialEmail} />
            </HideWhenSubscribed>
            <HomeSnippetsList stackItems={stackItems} />
          </div>
        </div>
      </section>

      <HomeAboutSection totalCount={totalCount} />
    </div>
    </>
  );
}
