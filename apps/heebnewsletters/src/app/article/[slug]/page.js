import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getVaultIssueBySlug,
  getVaultIssues,
} from "@/lib/vault";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import SubscribedArticleView from "@/components/SubscribedArticleView";
import NavLogoImageSync from "@/components/NavLogoImageSync";
import ArticleSubscribeForm from "@/components/ArticleSubscribeForm";
import VaultIssueBody from "@/components/VaultIssueBody";
import VaultPodcastPromo from "@/components/VaultPodcastPromo";
import AdSlot from "@/components/AdSlot";
import ArticleAdStickyBottom from "@/components/ArticleAdStickyBottom";
import JsonLd from "@/components/JsonLd";
import { crossPromoForSlot } from "@/config/crossPromoAds";
import { siteConfig, siteDisplayName } from "@/config/site";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";

const SLOT_RAIL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL;
const SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM;

const SHOW_RAIL = CROSS_PROMO || !!SLOT_RAIL;
const SHOW_BOTTOM = CROSS_PROMO || !!SLOT_BOTTOM;

function absoluteUrl(maybeUrl) {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, siteConfig.siteUrl).toString();
  } catch {
    return null;
  }
}

function formatIssueDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/** `editorIntro` may be a plain string (paragraphs split on blank lines) or Portable Text. */
function EditorIntro({ editorIntro }) {
  if (!editorIntro) return null;
  if (typeof editorIntro === "string") {
    const paragraphs = editorIntro.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean);
    if (paragraphs.length === 0) return null;
    return (
      <>
        {paragraphs.map((p, i) => (
          <p key={i} className={styles.editorIntroPara}>
            {p}
          </p>
        ))}
      </>
    );
  }
  if (Array.isArray(editorIntro)) {
    return <VaultIssueBody body={editorIntro} />;
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const issue = await getVaultIssueBySlug(slug);
  if (!issue) return { title: siteDisplayName };

  const canonical = `/article/${slug}`;
  const fallbackDescription = issue.summary?.trim() || undefined;
  const description = (issue.seoDescription?.trim() || fallbackDescription) ?? undefined;
  const title = issue.seoTitle?.trim()
    ? issue.seoTitle
    : `${issue.title} | ${siteDisplayName}`;

  const social = issue.socialImage;
  const ogImageEntry = social?.url
    ? { url: social.url, width: social.width || 1200, height: social.height || 630, alt: issue.title }
    : issue.heroImage?.url
      ? {
          url: issue.heroImage.url,
          width: issue.heroImage.width || 1200,
          height: issue.heroImage.height || 630,
          alt: issue.title,
        }
      : null;

  const authors = issue.authorName ? [{ name: issue.authorName }] : undefined;
  const robots = issue.noIndex ? { index: false, follow: false } : undefined;

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
      ...(issue.publishedDate ? { publishedTime: issue.publishedDate } : {}),
      ...(issue.dateModified ? { modifiedTime: issue.dateModified } : {}),
      ...(issue.authorName ? { authors: [issue.authorName] } : {}),
      ...(issue.tags?.length ? { tags: issue.tags } : {}),
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

export default async function VaultIssuePage({ params }) {
  const { slug } = await params;

  const [issue, allIssues] = await Promise.all([
    getVaultIssueBySlug(slug),
    getVaultIssues(),
  ]);
  if (!issue) notFound();

  const readMore = pickRandomArticles(allIssues, {
    count: READ_MORE_COUNT,
    excludeSlug: slug,
  });

  const canonicalIssueUrl = `${siteConfig.siteUrl.replace(/\/?$/, "")}/article/${slug}`;
  const heroImageUrl = issue.socialImage?.url || issue.heroImage?.url || issue.mainImage || null;
  const publishedDateLabel = formatIssueDate(issue.publishedDate);
  const hasOriginalPub = Boolean(issue.originalPublication || issue.originalYear);
  const showBuyCta = Boolean(issue.buyCtaLabel && issue.originalIssueUrl);
  const rabbitHole = Array.isArray(issue.rabbitHole) ? issue.rabbitHole : [];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: issue.title,
    description: (issue.seoDescription || issue.summary || "").trim() || undefined,
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalIssueUrl },
    url: canonicalIssueUrl,
    ...(issue.publishedDate ? { datePublished: issue.publishedDate } : {}),
    ...(issue.dateModified ? { dateModified: issue.dateModified } : {}),
    ...(issue.authorName
      ? { author: { "@type": "Person", name: issue.authorName } }
      : {}),
    publisher: {
      "@type": "Organization",
      name: siteDisplayName,
      url: siteConfig.siteUrl,
    },
    ...(heroImageUrl ? { image: [heroImageUrl] } : {}),
    ...(issue.tags?.length ? { keywords: issue.tags.join(", ") } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.siteUrl },
      { "@type": "ListItem", position: 2, name: issue.title, item: canonicalIssueUrl },
    ],
  };

  const HeroImageBlock = issue.heroImage?.url ? (
    <div className={styles.leadImageSection}>
      <div className={styles.leadImageFrame}>
        <Image
          src={issue.heroImage.url}
          alt={issue.title}
          width={issue.heroImage.width || 1200}
          height={issue.heroImage.height || 800}
          priority
          className={styles.leadImage}
          sizes="(max-width: 640px) 100vw, 640px"
        />
      </div>
      {issue.photoCredit ? (
        <p className={styles.leadImageCredit}>{issue.photoCredit}</p>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={styles.page}>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <SubscribedArticleView slug={slug} />
      <NavLogoImageSync image={issue.mainImage} />
      <section className="articlebody-section">
        <div className={`${styles.articleHeroBlock} ${styles.articleHeroBlockInline}`}>
          <div className={styles.articleHeroContent}>
              <div className="spacer-3rem" />

              {issue.editorIntro ? (
                <div className={styles.editorIntro}>
                  <p className={styles.editorIntroKicker}>From the editor</p>
                  <div className={styles.editorIntroText}>
                    <EditorIntro editorIntro={issue.editorIntro} />
                  </div>
                  {(issue.editorSignature?.url || issue.editorName) && (
                    <div className={styles.editorSignatureRow}>
                      {issue.editorSignature?.url ? (
                        <Image
                          src={issue.editorSignature.url}
                          alt={issue.editorName || "Editor signature"}
                          width={issue.editorSignature.width}
                          height={issue.editorSignature.height}
                          className={styles.editorSignatureImg}
                        />
                      ) : null}
                      {issue.editorName ? (
                        <p className={styles.editorName}>
                          {issue.editorName}
                          {issue.editorTitle ? (
                            <span className={styles.editorTitle}> — {issue.editorTitle}</span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              ) : null}

              {issue.originalIssueUrl ? (
                <Link
                  href={issue.originalIssueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read the original issue: ${issue.title}`}
                >
                  {HeroImageBlock}
                </Link>
              ) : (
                HeroImageBlock
              )}

              {issue.eraLabel ? (
                <p className={styles.eraPill}>
                  <span>{issue.eraLabel}</span>
                </p>
              ) : null}

              <div className="headline-block">
                <h1 className="headline-text">{issue.title}</h1>
              </div>

              {(issue.authorName || issue.photographerCredit || publishedDateLabel) && (
                <p className={styles.issueByline}>
                  {issue.authorName ? <>By {issue.authorName}</> : null}
                  {issue.authorName && issue.photographerCredit ? " · " : null}
                  {issue.photographerCredit ? (
                    <>Photography by {issue.photographerCredit}</>
                  ) : null}
                  {(issue.authorName || issue.photographerCredit) && publishedDateLabel ? " · " : null}
                  {publishedDateLabel}
                </p>
              )}

              {hasOriginalPub ? (
                <p className={styles.originalPubLine}>
                  {issue.originalIssueUrl ? (
                    <Link
                      href={issue.originalIssueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Originally published{issue.originalPublication ? ` in ${issue.originalPublication}` : ""}
                      {issue.originalYear ? `, ${issue.originalYear}` : ""}
                    </Link>
                  ) : (
                    <>
                      Originally published{issue.originalPublication ? ` in ${issue.originalPublication}` : ""}
                      {issue.originalYear ? `, ${issue.originalYear}` : ""}
                    </>
                  )}
                </p>
              ) : null}
          </div>
        </div>

        <div className={`${styles.articleBodyGrid} ${styles.articleBodyGridBlocksFirst}`}>
          <div className={styles.articleMain}>
            <div className={styles.articleContainerNoPadding}>
              <div className="articlecopy-wrapper">
                <div className="articlecopy-richtext">
                  <VaultIssueBody body={issue.body} />

                  {showBuyCta ? (
                    <div className={styles.buyCtaRow}>
                      <Link
                        href={issue.originalIssueUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.buyCta}
                      >
                        {issue.buyCtaLabel}
                      </Link>
                    </div>
                  ) : null}

                  {rabbitHole.length > 0 ? (
                    <section className={styles.rabbitHole} aria-label="The Rabbit Hole">
                      <h2 className={styles.rabbitHoleTitle}>The Rabbit Hole</h2>
                      <ul className={styles.rabbitHoleList}>
                        {rabbitHole.map((item, index) => (
                          <li key={item._key || index} className={styles.rabbitHoleItem}>
                            <span className={styles.rabbitHoleItemTitle}>{item.title}</span>
                            {item.url ? (
                              <Link
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.rabbitHoleSourceBtn}
                              >
                                {item.sourceLabel || "Read more"}
                              </Link>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}

                  <VaultPodcastPromo />
                </div>
              </div>

              {SHOW_BOTTOM && (
                <div className={styles.adBottom}>
                  <AdSlot slotId={SLOT_BOTTOM} format="rectangle" {...crossPromoForSlot("bottom")} />
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
              <AdSlot slotId={SLOT_RAIL} format="vertical" {...crossPromoForSlot("rail")} />
            </div>
          )}
        </div>

        {readMore.length > 0 && (
          <div className={styles.readMoreOuter}>
            <section className={styles.readMore} aria-label="From the Vault">
              <h2 className={styles.readMoreTitle}>More from the Vault</h2>
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
                    <h3 className={styles.readMoreHeadline}>{rec.title}</h3>
                    {rec.summary && <p className={styles.readMoreDek}>{rec.summary}</p>}
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
