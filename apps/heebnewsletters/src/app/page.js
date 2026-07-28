import {
  getArticles,
} from "@/lib/articles";
import HomeMosaic from "@/components/HomeMosaic";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
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
  process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/ftv-wordmark-black.png";

function absoluteSiteUrl(path) {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

function firstWordsWithEllipsis(text, wordCount = 150) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "";
  const words = clean.split(" ");
  if (words.length <= wordCount) return clean;
  return `${words.slice(0, wordCount).join(" ")}…`;
}

function plainTextFromPortableText(value) {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  return value
    .filter((block) => block?._type === "block")
    .map((block) => (block.children || []).map((child) => child?.text || "").join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function featuredPreviewFromArticle(article) {
  const fromIntro = plainTextFromPortableText(article?.editorIntro);
  const fromBody = plainTextFromPortableText(article?.body);
  const fallback = (article?.summary || "").trim();
  return firstWordsWithEllipsis(fromIntro || fromBody || fallback, 150);
}

/** Strip heavy Portable Text before sending the mosaic to the client. */
function toMosaicArticle(article) {
  return {
    _id: article._id,
    slug: article.slug,
    title: article.title,
    eraLabel: article.eraLabel || "",
    mainImage: article.mainImage,
    mainImageWidth: article.mainImageWidth,
    mainImageHeight: article.mainImageHeight,
    cardDek: (article.summary || "").trim(),
    featuredPreview: featuredPreviewFromArticle(article),
  };
}

export default async function Home({ searchParams: searchParamsProp }) {
  const searchParams = typeof searchParamsProp?.then === "function" ? await searchParamsProp : searchParamsProp ?? {};
  const initialEmail = searchParams?.email ? decodeURIComponent(String(searchParams.email)) : undefined;

  const articles = await getArticles();
  const totalCount = articles.length;
  const mosaicArticles = articles.map(toMosaicArticle);

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
        {totalCount > 0 ? (
          <section className={styles.hero}>
            <div className="container">
              <p className={styles.heroMeta}>
                {totalCount} issue{totalCount !== 1 ? "s" : ""} in the archive
                <HideWhenSubscribed>
                  <>
                    {" • "}
                    <a href="/#subscribe">Get the next one in your inbox</a>
                  </>
                </HideWhenSubscribed>
              </p>
            </div>
          </section>
        ) : null}

        <HomeMosaic articles={mosaicArticles} initialEmail={initialEmail} />

        <HomeAboutSection totalCount={totalCount} />
      </div>
    </>
  );
}
