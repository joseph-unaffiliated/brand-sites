import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSlangEntryBySlug, getSlangEntries } from "@/lib/slang";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import { buildPollVoteUrl, getOptionCode } from "@/lib/vote-block";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import SubscribedArticleView from "@/components/SubscribedArticleView";
import NavLogoImageSync from "@/components/NavLogoImageSync";
import ArticleSubscribeForm from "@/components/ArticleSubscribeForm";
import MyWordButton from "@/components/MyWordButton";
import AdSlot from "@/components/AdSlot";
import ArticleStickyBottom from "@/components/ArticleStickyBottom";
import JsonLd from "@/components/JsonLd";
import { ogImageFromMappedContent } from "@publication-websites/sanity-content";
import { crossPromoForSlot } from "@/config/crossPromoAds";
import { amazonAssociatesTag, siteConfig, siteDisplayName } from "@/config/site";
import { affiliateAnchorProps } from "@publication-websites/affiliate";
import styles from "./page.module.css";

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";

const SLOT_RAIL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL;
const SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM;

const SHOW_RAIL = CROSS_PROMO || !!SLOT_RAIL;
const SHOW_BOTTOM = CROSS_PROMO || !!SLOT_BOTTOM;

// No generateStaticParams: the root layout reads request headers (nav logo
// image fill), so this route is dynamic. Marking it SSG makes Next throw
// "static to dynamic at runtime" on slugs unknown at build time.
export const dynamic = "force-dynamic";

function absoluteUrl(maybeUrl) {
  if (!maybeUrl) return null;
  try {
    return new URL(maybeUrl, siteConfig.siteUrl).toString();
  } catch {
    return null;
  }
}

/** Bold the defined term (and a simple plural like “hits different”) in In Use copy. */
function emphasizeTerm(text, term) {
  if (!text || !term) return text;
  const parts = term.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return text;
  const variants = [parts.join(" ")];
  if (!/s$/i.test(parts[0])) {
    variants.push([`${parts[0]}s`, ...parts.slice(1)].join(" "));
  }
  const pattern = variants
    .sort((a, b) => b.length - a.length)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"))
    .join("|");
  const re = new RegExp(`(${pattern})`, "gi");
  const nodes = [];
  let last = 0;
  let match;
  let i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(<strong key={`t${i++}`}>{match[0]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes.length ? nodes : text;
}

function descriptionForEntry(entry) {
  if (entry.seoDescription?.trim()) return entry.seoDescription.trim();
  if (entry.think?.trim()) return `${entry.title}: ${entry.think.trim()}`;
  return `${entry.title} — defined in the Dictionary of Slang from ${siteDisplayName}.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const entry = await getSlangEntryBySlug(slug);
  if (!entry) return { title: siteDisplayName };

  const canonical = `/word/${slug}`;
  const description = descriptionForEntry(entry);
  const title = entry.seoTitle?.trim()
    ? entry.seoTitle
    : `${entry.title} | ${siteDisplayName}`;

  const ogImageEntry = ogImageFromMappedContent(entry);

  return {
    title,
    description,
    alternates: { canonical },
    ...(entry.authorName ? { authors: [{ name: entry.authorName }] } : {}),
    ...(entry.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical) ?? canonical,
      siteName: siteDisplayName,
      type: "article",
      ...(entry.publishedDate ? { publishedTime: entry.publishedDate } : {}),
      ...(entry.dateModified ? { modifiedTime: entry.dateModified } : {}),
      ...(entry.authorName ? { authors: [entry.authorName] } : {}),
      ...(entry.tags?.length ? { tags: entry.tags } : {}),
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

const MORE_WORDS_COUNT = 3;

export default async function WordPage({ params }) {
  const { slug } = await params;

  const [entry, allEntries] = await Promise.all([
    getSlangEntryBySlug(slug),
    getSlangEntries(),
  ]);
  if (!entry) notFound();

  const moreWords = pickRandomArticles(allEntries, {
    count: MORE_WORDS_COUNT,
    excludeSlug: slug,
  });

  const canonicalWordUrl = `${siteConfig.siteUrl.replace(/\/$/, "")}/word/${slug}`;
  const heroImageUrl =
    entry.socialImage?.url || entry.heroImage?.url || entry.mainImage || null;
  const inUseParagraphs = (entry.inUse || "")
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: entry.title,
    description: descriptionForEntry(entry),
    inLanguage: "en",
    url: canonicalWordUrl,
    ...(entry.publishedDate ? { dateCreated: entry.publishedDate } : {}),
    ...(entry.dateModified ? { dateModified: entry.dateModified } : {}),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: `${siteDisplayName} — The Dictionary of Slang`,
      url: `${siteConfig.siteUrl.replace(/\/$/, "")}/archive`,
    },
    ...(heroImageUrl ? { image: [heroImageUrl] } : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.siteUrl },
      {
        "@type": "ListItem",
        position: 2,
        name: "Words",
        item: `${siteConfig.siteUrl.replace(/\/$/, "")}/archive`,
      },
      { "@type": "ListItem", position: 3, name: entry.title, item: canonicalWordUrl },
    ],
  };

  return (
    <div className={styles.page}>
      <JsonLd data={definedTermJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <SubscribedArticleView slug={slug} />
      <NavLogoImageSync image={entry.mainImage} />
      <section className="articlebody-section">
        <div className={`${styles.articleHeroBlock} ${styles.articleHeroBlockInline}`}>
          <div className={styles.articleHero}>
            <div className={styles.articleHeroContent}>
              <div className="spacer-3rem" />
              {entry.heroImage?.url || entry.mainImage ? (
                <div className={styles.leadImageSection}>
                  <div className={styles.leadImageFrame}>
                    <Image
                      src={entry.heroImage?.url || entry.mainImage}
                      alt={entry.title}
                      width={entry.heroImage?.width || 1200}
                      height={entry.heroImage?.height || 800}
                      priority
                      className={styles.leadImage}
                      sizes="(max-width: 640px) 100vw, 640px"
                    />
                  </div>
                  {entry.pronunciation ? (
                    <p className={styles.pronunciation}>{entry.pronunciation}</p>
                  ) : null}
                </div>
              ) : entry.pronunciation ? (
                <p className={styles.pronunciation}>{entry.pronunciation}</p>
              ) : null}
              <div className={`headline-block ${styles.headlineBlock}`}>
                <h1 className={`headline-text ${styles.visuallyHidden}`}>{entry.title}</h1>
                {entry.think ? (
                  <p className={`headline-text ${styles.thinkHeadline}`}>{entry.think}</p>
                ) : null}
              </div>
              <div className={styles.wordMetaRow}>
                {entry.publishedDate ? (
                  <span className={styles.wordMetaItem}>
                    {new Date(entry.publishedDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                ) : null}
                <MyWordButton slug={slug} />
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.articleBodyGrid} ${styles.articleBodyGridBlocksFirst}`}>
          <div className={styles.articleMain}>
            <div className={styles.articleContainerNoPadding}>
              <div className="articlecopy-wrapper">
                <div className="articlecopy-richtext">
                  <article className={styles.wordBody}>
                    {inUseParagraphs.length > 0 ? (
                      <section className={styles.inUseSection} aria-label="In use">
                        <div className={styles.inUseDialogue}>
                          <h2 className={styles.inUseHeading}>In Use</h2>
                          {entry.inUseAttribution ? (
                            <p className={styles.inUseAttribution}>
                              {entry.inUseAttribution}
                            </p>
                          ) : null}
                          {inUseParagraphs.map((line, index) => (
                            <p key={index}>{emphasizeTerm(line, entry.title)}</p>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    {entry.pollOptions?.length ? (
                      <section className={styles.pollSection} aria-label="Pop quiz">
                        <p className={styles.pollEyebrow}>Pop Quiz</p>
                        {entry.pollQuestion ? (
                          <h2 className={styles.pollQuestion}>{entry.pollQuestion}</h2>
                        ) : null}
                        <ul className={styles.pollOptions}>
                          {entry.pollOptions.map((opt, index) => {
                            const code = getOptionCode({ code: opt.key }, index);
                            const voteUrl = buildPollVoteUrl({
                              siteUrl: siteConfig.siteUrl,
                              issueSlug: slug,
                              choiceCode: code,
                              viaHome: false,
                            });
                            return (
                              <li key={opt._key ?? code ?? index}>
                                {voteUrl ? (
                                  <Link href={voteUrl} className={styles.pollOptionLink}>
                                    {code ? `${code.toUpperCase()}. ` : ""}
                                    {opt.label}
                                  </Link>
                                ) : (
                                  <span className={styles.pollOptionLink}>{opt.label}</span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ) : null}

                    {entry.furtherReading?.length ? (
                      <section className={styles.aroundTheWeb} aria-label="What else?">
                        <h2 className={styles.aroundTheWebTitle}>What else?</h2>
                        <ul className={styles.aroundTheWebList}>
                          {entry.furtherReading.map((item) => (
                            <li key={item._key ?? item.url ?? item.label}>
                              {item.url ? (
                                <a
                                  {...affiliateAnchorProps(item.url, amazonAssociatesTag)}
                                  className={styles.aroundTheWebItemLink}
                                >
                                  <h3 className={styles.aroundTheWebItemTitle}>{item.label}</h3>
                                  <span className={styles.aroundTheWebCta}>
                                    {item.sourceName || "Read more"}
                                  </span>
                                </a>
                              ) : (
                                <h3 className={styles.aroundTheWebItemTitle}>{item.label}</h3>
                              )}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    {entry.disclaimer ? (
                      <p className={styles.disclaimer}>{entry.disclaimer}</p>
                    ) : null}
                  </article>
                </div>
              </div>
              {SHOW_BOTTOM && (
                <div className={styles.adBottom}>
                  <AdSlot slotId={SLOT_BOTTOM} format="rectangle" {...crossPromoForSlot("bottom")} />
                </div>
              )}
            </div>
          </div>
          {SHOW_RAIL && (
            <div className={styles.articleRail}>
              <div className={styles.articleRailSticky}>
                <AdSlot slotId={SLOT_RAIL} format="vertical" {...crossPromoForSlot("rail")} />
              </div>
            </div>
          )}
        </div>
        <HideWhenSubscribed>
          <section className="newslettercta-section">
            <div className="newslettercta-block">
              <div className="newslettercta-prompt">
                <span>Subscribe for more from </span>
                <span>{siteDisplayName}</span>
                <span className="italic">, one word a week in your inbox</span>
              </div>
              <ArticleSubscribeForm />
            </div>
          </section>
        </HideWhenSubscribed>
        {moreWords.length > 0 && (
          <div className={styles.readMoreOuter}>
            <section className={styles.readMore} aria-label="More words">
              <h2 className={styles.readMoreTitle}>More words</h2>
              <div className={styles.readMoreGrid}>
                {moreWords.map((rec) => (
                  <Link
                    key={rec._id ?? rec.slug}
                    href={`/word/${rec.slug}`}
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
                    {rec.think && <p className={styles.readMoreDek}>{rec.think}</p>}
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
