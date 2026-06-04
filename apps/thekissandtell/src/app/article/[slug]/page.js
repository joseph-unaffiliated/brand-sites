import Link from "next/link";
import SanityMedia from "@/components/SanityMedia";
import { notFound } from "next/navigation";
import { getArticleBySlug, getArticleSlugs, getArticles } from "@/lib/articles";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import SubscribedArticleView from "@/components/SubscribedArticleView";
import NavLogoImageSync from "@/components/NavLogoImageSync";
import ArticleSubscribeForm from "@/components/ArticleSubscribeForm";
import AdSlot from "@/components/AdSlot";
import ArticleAdStickyBottom from "@/components/ArticleAdStickyBottom";
import { siteDisplayName, siteKickerLower } from "@/config/site";
import { crossPromoForSlot } from "@/config/crossPromoAds";
import styles from "./page.module.css";

const SLOT_RAIL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL;
const SLOT_MID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID;
const SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM;

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";

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

  const entries = article.entries ?? [];
  const midIndex = Math.floor(entries.length / 2);

  return (
    <div className={styles.page}>
      <NavLogoImageSync image={article.mainImage} />
      <SubscribedArticleView slug={slug} />
      <section className="articlebody-section">
        <div className={styles.articleHeroBlock}>
          <div className={styles.articleHero}>
            <div className={styles.articleHeroContent}>
              <div className={styles.backLink}>
                <Link href="/archive">Back to archive</Link>
              </div>
              <div className="spacer-1-5rem" />
              <div className="headline-block">
                {article.kicker && article.kicker.trim().toLowerCase() !== siteKickerLower && (
                  <p className={styles.kicker}>{article.kicker}</p>
                )}
                <h1 className="headline-text">{article.title}</h1>
                <div className="subtitle-container">
                  <p>{article.subtitle}</p>
                </div>
              </div>
              <div className="spacer-4rem" />
            </div>
          </div>
          <div className={styles.articleHeroImage}>
            <div className="mainimage-block">
              <SanityMedia
                src={article.mainImage}
                alt=""
                width={article.mainImageWidth || 900}
                height={article.mainImageHeight || 600}
                priority
                className={styles.mainImage}
              />
            </div>
          </div>
        </div>
        <div className={styles.articleBodyGrid}>
          <div className={styles.articleMain}>
            <div className={styles.articleContainerNoPadding}>
              <div className="articlecopy-wrapper">
                <div className="articlecopy-richtext">
                  {entries.slice(0, midIndex).map((entry) => (
                    <article key={entry.title} className={styles.entry}>
                      <p className={styles.age}>{entry.age}</p>
                      <h2>{entry.title}</h2>
                      <p>{entry.body}</p>
                    </article>
                  ))}
                  {SHOW_MID && midIndex > 0 && (
                    <div className={styles.adMid}>
                      <AdSlot slotId={SLOT_MID} format="rectangle" {...crossPromoForSlot("mid")} />
                    </div>
                  )}
                  {entries.slice(midIndex).map((entry) => (
                    <article key={entry.title} className={styles.entry}>
                      <p className={styles.age}>{entry.age}</p>
                      <h2>{entry.title}</h2>
                      <p>{entry.body}</p>
                    </article>
                  ))}
                </div>
                {article.disclaimer && (
                  <div className="articlecopy-richtext">
                    <p className={styles.disclaimer}>{article.disclaimer}</p>
                  </div>
                )}
              </div>
              {SHOW_BOTTOM && (
                <div className={styles.adBottom}>
                  <AdSlot slotId={SLOT_BOTTOM} format="rectangle" {...crossPromoForSlot("bottom")} />
                </div>
              )}
              <div className="spacer-4rem" />
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
              {readMore.length > 0 && (
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
                          <SanityMedia
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
              )}
            </div>
          </div>
          {SHOW_RAIL && (
            <div className={styles.articleRail}>
              <AdSlot slotId={SLOT_RAIL} format="vertical" {...crossPromoForSlot("rail")} />
            </div>
          )}
        </div>
      </section>
      <ArticleAdStickyBottom />
    </div>
  );
}
