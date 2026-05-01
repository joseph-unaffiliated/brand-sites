import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticleBySlug,
  getArticleSlugs,
  getArticles,
  dedupeSubtitleInContentBlocks,
} from "@/lib/articles";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import RecordArticleView from "@/components/RecordArticleView";
import ArticleSubscribeForm from "@/components/ArticleSubscribeForm";
import ArticleContentBlocks from "@/components/ArticleContentBlocks";
import AdSlot from "@/components/AdSlot";
import ArticleAdStickyBottom from "@/components/ArticleAdStickyBottom";
import { siteDisplayName, siteKickerLower } from "@/config/site";
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

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: siteDisplayName };
  return {
    title: `${article.title} | ${siteDisplayName}`,
    description: article.summary || article.subtitle,
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

  const readMore = allArticles
    .filter((a) => a.slug !== slug)
    .slice(0, READ_MORE_COUNT);

  const contentBlocks = article.contentBlocks ?? [];
  const showBlocks =
    Array.isArray(contentBlocks) &&
    contentBlocks.length > 0 &&
    Boolean(SANITY_PROJECT_ID);

  const contentBlocksForRender = showBlocks
    ? dedupeSubtitleInContentBlocks(contentBlocks, article.subtitle, article.title)
    : contentBlocks;

  return (
    <div className={styles.page}>
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
                          alt=""
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
                  alt=""
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
              <HideWhenSubscribed>
            <section className="newslettercta-section">
              <div className="newslettercta-block">
                <div className="newslettercta-prompt">
                  <span>Subscribe for more from </span>
                  <span>{siteDisplayName}</span>
                  <span className="italic">, weekly in your inbox</span>
                </div>
                <ArticleSubscribeForm />
              </div>
            </section>
          </HideWhenSubscribed>
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
                        alt=""
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
      <ArticleAdStickyBottom />
    </div>
  );
}
