import Image from "next/image";
import Link from "next/link";
import { getSlangEntries } from "@/lib/slang";
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
  process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/hip-photo.png";

function absoluteSiteUrl(path) {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Atlantic-style: 2 center, 4 left, N in right stack. No word repeated. */
const CENTER_COUNT = 2;
const LEFT_COUNT = 4;
/** Max items for "More words" (client shows 2 when signed out, 5 when signed in). */
const STACK_COUNT_MAX = 5;

export default async function Home({ searchParams: searchParamsProp }) {
  const searchParams = typeof searchParamsProp?.then === "function" ? await searchParamsProp : searchParamsProp ?? {};
  const initialEmail = searchParams?.email ? decodeURIComponent(String(searchParams.email)) : undefined;

  const entries = await getSlangEntries();
  const totalCount = entries.length;

  const featuredEntries = entries.slice(0, CENTER_COUNT);
  const leftCards = entries.slice(CENTER_COUNT, CENTER_COUNT + LEFT_COUNT);
  const stackItems = entries.slice(
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
                {totalCount} word{totalCount !== 1 ? "s" : ""} in the archive
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
            {leftCards.map((entry) => (
              <article className={styles.mosaicCard} key={entry._id ?? entry.slug}>
                <Link
                  href={`/word/${entry.slug}`}
                  className={styles.mosaicCardLink}
                >
                  <div className={styles.mosaicCardImage}>
                    <Image
                      src={entry.mainImage}
                      alt=""
                      width={400}
                      height={267}
                      sizes="(max-width: 900px) 100vw, 320px"
                    />
                  </div>
                  <div className={styles.mosaicCardBody}>
                    <h3 className={styles.mosaicCardHeadline}>{entry.title}</h3>
                    {entry.pronunciation && (
                      <p className={styles.mosaicCardDemographic}>{entry.pronunciation}</p>
                    )}
                    {entry.think && (
                      <p className={styles.mosaicCardDek}>Think: {entry.think}</p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* Center: featured words */}
          <div className={styles.mosaicCenter}>
            {featuredEntries.map((entry, index) => (
              <Link
                key={entry._id ?? entry.slug}
                href={`/word/${entry.slug}`}
                className={styles.featuredCard}
              >
                <div className={styles.featuredImage}>
                  <Image
                    src={entry.mainImage}
                    alt=""
                    width={entry.mainImageWidth || 900}
                    height={entry.mainImageHeight || 600}
                    priority={index === 0}
                    sizes="(max-width: 900px) 100vw, 560px"
                  />
                </div>
                <div className={styles.featuredBody}>
                  {index === 0 && (
                    <p className={styles.featuredKicker}>Word of the week</p>
                  )}
                  <h2 className={styles.featuredHeadline}>{entry.title}</h2>
                  {entry.pronunciation && (
                    <p className={styles.featuredDek}>{entry.pronunciation}</p>
                  )}
                  {entry.think ? (
                    <div className={styles.featuredEntryPreview}>
                      <p className={styles.featuredEntrySnippet}>Think: {entry.think}</p>
                    </div>
                  ) : null}
                  <span className={styles.featuredLink}>Get the word</span>
                </div>
              </Link>
            ))}
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
    </>
  );
}
