import Image from "next/image";
import Link from "next/link";
import {
  getArticles,
  bodyExcerptFromArticle,
} from "@/lib/articles";
import SubscribeBlock from "@/components/SubscribeBlock";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import HomeSnippetsList from "@/components/HomeSnippetsList";
import HomeAboutSection from "@/components/HomeAboutSection";
import JsonLd from "@/components/JsonLd";
import {
  siteConfig,
  siteDefaultDescription,
  siteDisplayName,
  siteHeroTagline,
  siteKickerLower,
} from "@/config/site";
import styles from "./page.module.css";

const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || siteDefaultDescription;
const SITE_OG_IMAGE_PATH =
  process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/hr-phone.png";

function absoluteSiteUrl(path) {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

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
  return firstWordsWithEllipsis(bodyText, 150);
}

export default async function Home({ searchParams: searchParamsProp }) {
  const searchParams = typeof searchParamsProp?.then === "function" ? await searchParamsProp : searchParamsProp ?? {};
  const initialEmail = searchParams?.email ? decodeURIComponent(String(searchParams.email)) : undefined;

  const articles = await getArticles();
  const totalCount = articles.length;

  const featured = articles[0] ?? null;
  const leftCards = articles.slice(1, 1 + LEFT_COUNT);
  const stackItems = articles.slice(1 + LEFT_COUNT, 1 + LEFT_COUNT + STACK_COUNT_MAX);

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
                    <Image
                      src={article.mainImage}
                      alt={article.title}
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
                    {article.subjectName ? (
                      <p
                        className={styles.mosaicCardSubject}
                        style={article.subjectColor ? { color: article.subjectColor } : undefined}
                      >
                        {article.subjectName}
                      </p>
                    ) : null}
                    {(() => {
                      const excerpt = bodyExcerptFromArticle(article, 2);
                      return excerpt ? (
                        <p className={styles.mosaicCardDek}>{excerpt}</p>
                      ) : null;
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
                    alt={featured.title}
                    width={featured.mainImageWidth || 900}
                    height={featured.mainImageHeight || 600}
                    priority
                    sizes="(max-width: 900px) 100vw, 560px"
                  />
                </div>
                <div className={styles.featuredBody}>
                  <h2 className={styles.featuredHeadline}>{featured.title}</h2>
                  {featured.subjectName ? (
                    <p
                      className={styles.featuredSubject}
                      style={featured.subjectColor ? { color: featured.subjectColor } : undefined}
                    >
                      {featured.subjectName}
                    </p>
                  ) : null}
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
