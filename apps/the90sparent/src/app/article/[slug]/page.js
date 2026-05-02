import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getArticleSlugs,
  getArticles,
  dedupeSubtitleInContentBlocks,
} from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import RecordArticleView from "@/components/RecordArticleView";
import ArticleContentBlocks from "@/components/ArticleContentBlocks";
import AdSlot from "@/components/AdSlot";
import ArticleStickyBottom from "@/components/ArticleStickyBottom";
import JsonLd from "@/components/JsonLd";
import { siteConfig, siteDisplayName, siteKickerLower } from "@/config/site";
import styles from "./page.module.css";

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";

const SLOT_RAIL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL;
const SLOT_MID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID;
const SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM;

const SHOW_RAIL = CROSS_PROMO || !!SLOT_RAIL;
const SHOW_MID = CROSS_PROMO || !!SLOT_MID;
const SHOW_BOTTOM = CROSS_PROMO || !!SLOT_BOTTOM;

export async function generateStaticParams() {
  return await getArticleSlugs();
}

function absoluteUrl(maybeUrl) {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, siteConfig.siteUrl).toString();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: siteDisplayName };

  const canonical = `/article/${slug}`;
  const fallbackDescription = (article.summary || article.subtitle || "").trim() || undefined;
  const description = (article.seoDescription?.trim() || fallbackDescription) ?? undefined;
  const title = article.seoTitle?.trim()
    ? article.seoTitle
    : `${article.title} | ${siteDisplayName}`;

  const social = article.socialImage;
  const ogImageEntry = social?.url
    ? {
        url: social.url,
        width: social.width || 1200,
        height: social.height || 630,
        alt: article.title,
      }
    : article.mainImage
      ? {
          url: article.mainImage,
          width: article.mainImageWidth || 1200,
          height: article.mainImageHeight || 630,
          alt: article.title,
        }
      : null;

  const authors = article.authorName ? [{ name: article.authorName }] : undefined;
  const robots = article.noIndex
    ? { index: false, follow: false }
    : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    authors,
    robots,
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical) ?? canonical,
      siteName: siteDisplayName,
      type: "article",
      ...(article.publishedDate ? { publishedTime: article.publishedDate } : {}),
      ...(article.dateModified ? { modifiedTime: article.dateModified } : {}),
      ...(article.authorName ? { authors: [article.authorName] } : {}),
      ...(article.tags?.length ? { tags: article.tags } : {}),
      ...(ogImageEntry ? { images: [ogImageEntry] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImageEntry ? { images: [ogImageEntry.url] } : {}),
    },
  };
}

const READ_MORE_COUNT = 3;

export default async function ArticlePage({ params }) {
  const { slug } = await params;

  const [article, allArticles] = await Promise.all([
    getArticleBySlug(slug),
    getArticles(),
  ]);
  if (!article) notFound();

  const readMore = pickRandomArticles(allArticles, {
    count: READ_MORE_COUNT,
    excludeSlug: slug,
  });

  const contentBlocks = article.contentBlocks ?? [];
  const showBlocks =
    Array.isArray(contentBlocks) &&
    contentBlocks.length > 0 &&
    Boolean(SANITY_PROJECT_ID);

  const contentBlocksForRender = showBlocks
    ? dedupeSubtitleInContentBlocks(contentBlocks, article.subtitle, article.title)
    : contentBlocks;

  const canonicalArticleUrl = `${siteConfig.siteUrl.replace(/\/$/, "")}/article/${slug}`;
  const heroImageUrl =
    article.socialImage?.url || article.heroImage?.url || article.mainImage || null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: (article.seoDescription || article.summary || article.subtitle || "").trim() || undefined,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalArticleUrl },
    url: canonicalArticleUrl,
    ...(article.publishedDate ? { datePublished: article.publishedDate } : {}),
    ...(article.dateModified ? { dateModified: article.dateModified } : {}),
    ...(article.authorName
      ? { author: { "@type": "Person", name: article.authorName } }
      : {}),
    publisher: {
      "@type": "Organization",
      name: siteDisplayName,
      url: siteConfig.siteUrl,
    },
    ...(heroImageUrl ? { image: [heroImageUrl] } : {}),
    ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
    ...(article.noIndex ? { isAccessibleForFree: true } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: article.title,
        item: canonicalArticleUrl,
      },
    ],
  };

  return (
    <div className={styles.page}>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <RecordArticleView slug={slug} />
      <section className="articlebody-section">
        {/* Centered hero: headline + optional cover image when not using content blocks */}
        <div
          className={`${styles.articleHeroBlock} ${showBlocks ? styles.articleHeroBlockInline : ""}`}
        >
          <div className={styles.articleHero}>
            <div className={styles.articleHeroContent}>
              <div className="spacer-3rem" />
              <div className={`headline-block ${showBlocks ? styles.headlineBlockIssue : ""}`}>
                {article.kicker && article.kicker.trim().toLowerCase() !== siteKickerLower && (
                  <p className={styles.kicker}>{article.kicker}</p>
                )}
                <h1 className="headline-text">{article.title}</h1>
                <div className={`subtitle-container ${showBlocks ? styles.issueSubtitle : ""}`}>
                  <p>{article.subtitle}</p>
                </div>
              </div>
              {showBlocks ? (
                <>
                  {article.authorName?.trim() ? (
                    <p className={styles.issueByline}>By {article.authorName.trim()}</p>
                  ) : null}
                  {article.heroImage?.url ? (
                    <div className={styles.leadImageSection}>
                      <div className={styles.leadImageFrame}>
                        <Image
                          src={article.heroImage.url}
                          alt={article.title}
                          width={article.heroImage.width || 1200}
                          height={article.heroImage.height || 800}
                          priority
                          className={styles.leadImage}
                          sizes="(max-width: 640px) 100vw, 640px"
                        />
                      </div>
                      {article.photoCredit ? (
                        <p className={styles.leadImageCredit}>{article.photoCredit}</p>
                      ) : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="spacer-4rem" />
              )}
            </div>
          </div>
          {!showBlocks && (
            <div className={styles.articleHeroImage}>
              <div className="mainimage-block">
                <Image
                  src={article.mainImage}
                  alt={article.title}
                  width={article.mainImageWidth || 900}
                  height={article.mainImageHeight || 600}
                  priority
                  className={styles.mainImage}
                />
                {article.photoCredit ? (
                  <p className={styles.heroPhotoCredit}>{article.photoCredit}</p>
                ) : null}
              </div>
            </div>
          )}
        </div>
        {/* Grid: copy left, rail right (rail only here, not beside hero) */}
        <div
          className={`${styles.articleBodyGrid} ${showBlocks ? styles.articleBodyGridBlocksFirst : ""}`}
        >
        <div className={styles.articleMain}>
          <div className={styles.articleContainerNoPadding}>
            <div className="articlecopy-wrapper">
                <div className="articlecopy-richtext">
                  {showBlocks && SANITY_PROJECT_ID ? (
                    <ArticleContentBlocks
                      blocks={contentBlocksForRender}
                      projectId={SANITY_PROJECT_ID}
                      dataset={SANITY_DATASET}
                      articleSlug={slug}
                      bio={article.bio ?? article.disclaimer}
                      authorName={article.authorName}
                    />
                  ) : article.summary ? (
                    <>
                      <article className={styles.entry}>
                        <p>{article.summary}</p>
                      </article>
                      {SHOW_MID && (
                        <div className={styles.adMid}>
                          <AdSlot slotId={SLOT_MID} format="rectangle" />
                        </div>
                      )}
                    </>
                  ) : null}
                </div>
                {!showBlocks && (article.bio ?? article.disclaimer) && (
                  <div className="articlecopy-richtext">
                    <p className={styles.bio}>{article.bio ?? article.disclaimer}</p>
                  </div>
                )}
              </div>
              {SHOW_BOTTOM && (
                <div className={styles.adBottom}>
                  <AdSlot slotId={SLOT_BOTTOM} format="rectangle" />
                </div>
              )}
          </div>
        </div>
        {SHOW_RAIL && (
          <div className={styles.articleRail}>
            <AdSlot slotId={SLOT_RAIL} format="vertical" />
          </div>
        )}
        </div>
        {readMore.length > 0 && (
          <div className={styles.readMoreOuter}>
            <section className={styles.readMore} aria-label="Keep reading">
              <h2 className={styles.readMoreTitle}>Keep reading</h2>
              <div className={styles.readMoreGrid}>
                {readMore.map((rec) => (
                  <Link
                    key={rec._id ?? rec.slug}
                    href={`/article/${rec.slug}`}
                    className={styles.readMoreCard}
                  >
                    <div className={styles.readMoreThumb}>
                      <Image
                        src={rec.mainImage}
                        alt={rec.title}
                        width={280}
                        height={187}
                        sizes="(max-width: 640px) 100vw, 280px"
                      />
                    </div>
                    {rec.kicker && rec.kicker.trim().toLowerCase() !== siteKickerLower && (
                      <p className={styles.readMoreKicker}>{rec.kicker}</p>
                    )}
                    <h3 className={styles.readMoreHeadline}>{rec.title}</h3>
                    {rec.summary && (
                      <p className={styles.readMoreDek}>{rec.summary}</p>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
      <ArticleStickyBottom />
    </div>
  );
}
