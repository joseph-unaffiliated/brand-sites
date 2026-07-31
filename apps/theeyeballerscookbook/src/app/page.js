import Image from "next/image";
import Link from "next/link";
import { getCategories, getRecipes } from "@/lib/recipes";
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
  process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/tec-photo.png";

function absoluteSiteUrl(path) {
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  if (!path) return base;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** Atlantic-style: 1 center, 2 left, N in right stack. No recipe repeated. */
const LEFT_COUNT = 2;
/** Max items for "More recipes" (client shows 2 when signed out, 5 when signed in). */
const STACK_COUNT_MAX = 5;

function stepText(step) {
  if (typeof step === "string") return step.trim();
  if (step && typeof step.text === "string") return step.text.trim();
  return "";
}

/** Opening recipe copy for the featured card (dek + method steps). */
function featuredPreviewParagraphsFromRecipe(recipe, wordCount = 120) {
  const paragraphs = [];
  if (recipe?.description?.trim()) paragraphs.push(recipe.description.trim());
  for (const step of recipe?.steps ?? []) {
    const text = stepText(step);
    if (text) paragraphs.push(text);
  }
  if (paragraphs.length === 0) {
    const ingredients = (recipe?.ingredients ?? []).slice(0, 5);
    if (ingredients.length === 0) return [];
    return [`What you'll need: ${ingredients.join(", ").toLowerCase()}…`];
  }

  const out = [];
  let wordsUsed = 0;
  for (const para of paragraphs) {
    if (wordsUsed >= wordCount) break;
    const words = para.split(/\s+/).filter(Boolean);
    const remaining = wordCount - wordsUsed;
    if (words.length <= remaining) {
      out.push(para);
      wordsUsed += words.length;
    } else {
      out.push(`${words.slice(0, remaining).join(" ")}…`);
      break;
    }
  }
  return out;
}

export default async function Home({ searchParams: searchParamsProp }) {
  const searchParams = typeof searchParamsProp?.then === "function" ? await searchParamsProp : searchParamsProp ?? {};
  const initialEmail = searchParams?.email ? decodeURIComponent(String(searchParams.email)) : undefined;

  const [recipes, categories] = await Promise.all([getRecipes(), getCategories()]);
  const totalCount = recipes.length;

  const featured = recipes[0] ?? null;
  const leftCards = recipes.slice(1, 1 + LEFT_COUNT);
  const stackItems = recipes.slice(1 + LEFT_COUNT, 1 + LEFT_COUNT + STACK_COUNT_MAX);
  const featuredPreview = featured ? featuredPreviewParagraphsFromRecipe(featured) : [];

  const usedCategorySlugs = new Set(recipes.map((r) => r.category?.slug).filter(Boolean));
  const categoryTiles = categories.filter((c) => usedCategorySlugs.has(c.slug));

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
                {totalCount} recipe{totalCount !== 1 ? "s" : ""} in the cookbook
                <HideWhenSubscribed>
                  <>
                    {" • "}
                    <a href="/#subscribe">Get the next one in your inbox</a>
                  </>
                </HideWhenSubscribed>
              </p>
            )}
            {categoryTiles.length > 0 && (
              <nav className={styles.categoryRow} aria-label="Recipe categories">
                {categoryTiles.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/recipes/category/${category.slug}`}
                    className={styles.categoryPill}
                  >
                    {category.title}
                  </Link>
                ))}
                <Link href="/recipes" className={`${styles.categoryPill} ${styles.categoryPillAll}`}>
                  All recipes
                </Link>
              </nav>
            )}
          </div>
        </section>

        {/* Atlantic mosaic: 2 left | 1 center | right stack + subscribe */}
        <section className={styles.mosaic} id="subscribe">
        <div className={styles.mosaicContainer}>
          {/* Left column */}
          <div className={styles.mosaicLeft}>
            {leftCards.map((recipe) => (
              <article className={styles.mosaicCard} key={recipe._id ?? recipe.slug}>
                <Link
                  href={`/recipe/${recipe.slug}`}
                  className={styles.mosaicCardLink}
                >
                  <div className={styles.mosaicCardImage}>
                    <Image
                      src={recipe.mainImage}
                      alt=""
                      width={400}
                      height={267}
                      sizes="(max-width: 900px) 100vw, 320px"
                    />
                  </div>
                  <div className={styles.mosaicCardBody}>
                    <h3 className={styles.mosaicCardHeadline}>{recipe.title}</h3>
                    {recipe.category?.title && (
                      <p className={styles.mosaicCardDemographic}>{recipe.category.title}</p>
                    )}
                    {recipe.description && (
                      <p className={styles.mosaicCardDek}>{recipe.description}</p>
                    )}
                  </div>
                </Link>
              </article>
            ))}
          </div>

          {/* Center: one featured recipe filling left-column height */}
          <div className={styles.mosaicCenter}>
            {featured ? (
              <Link
                href={`/recipe/${featured.slug}`}
                className={styles.featuredCard}
              >
                <div className={styles.featuredImage}>
                  <Image
                    src={featured.mainImage}
                    alt=""
                    width={featured.mainImageWidth || 900}
                    height={featured.mainImageHeight || 600}
                    priority
                    sizes="(max-width: 900px) 100vw, 560px"
                  />
                </div>
                <div className={styles.featuredBody}>
                  <p className={styles.featuredKicker}>Recipe of the week</p>
                  <h2 className={styles.featuredHeadline}>{featured.title}</h2>
                  {featured.category?.title && (
                    <p className={styles.featuredDek}>{featured.category.title}</p>
                  )}
                  {featuredPreview.length > 0 ? (
                    <div className={styles.featuredEntryPreview}>
                      {featuredPreview.map((para, i) => (
                        <p key={i} className={styles.featuredEntrySnippet}>
                          {para}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  <span className={styles.featuredLink}>See more</span>
                </div>
              </Link>
            ) : null}
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

      <HomeSubscribeSection initialEmail={initialEmail} accentBand />
    </div>
    </>
  );
}
