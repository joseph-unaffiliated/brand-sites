import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeBySlug, getRecipes } from "@/lib/recipes";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import SubscribedArticleView from "@/components/SubscribedArticleView";
import NavLogoImageSync from "@/components/NavLogoImageSync";
import IngredientsChecklist from "@/components/IngredientsChecklist";
import FavoriteButton from "@/components/FavoriteButton";
import AdSlot from "@/components/AdSlot";
import ArticleStickyBottom from "@/components/ArticleStickyBottom";
import JsonLd from "@/components/JsonLd";
import { crossPromoForSlot } from "@/config/crossPromoAds";
import { siteConfig, siteDisplayName } from "@/config/site";
import styles from "./page.module.css";

const ADS_MODE = (process.env.NEXT_PUBLIC_ADS_MODE || "cross_promo").toLowerCase();
const CROSS_PROMO = ADS_MODE === "cross_promo";

const SLOT_RAIL = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RAIL;
const SLOT_BOTTOM = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM;

const SHOW_RAIL = CROSS_PROMO || !!SLOT_RAIL;
const SHOW_BOTTOM = CROSS_PROMO || !!SLOT_BOTTOM;

// No generateStaticParams: the root layout reads request headers (nav logo
// image fill), so these routes are dynamic. Marking them SSG makes Next throw
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

function descriptionForRecipe(recipe) {
  if (recipe.seoDescription?.trim()) return recipe.seoDescription.trim();
  if (recipe.description?.trim()) return recipe.description.trim();
  const ingredients = recipe.ingredients?.slice(0, 4).join(", ");
  return ingredients
    ? `${recipe.title} — an eyeballed recipe with ${ingredients.toLowerCase()}, and no measuring cups in sight.`
    : `${recipe.title} — an eyeballed recipe from ${siteDisplayName}.`;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) return { title: siteDisplayName };

  const canonical = `/recipe/${slug}`;
  const description = descriptionForRecipe(recipe);
  const title = recipe.seoTitle?.trim()
    ? recipe.seoTitle
    : `${recipe.title} | ${siteDisplayName}`;

  const social = recipe.socialImage;
  const ogImageEntry = social?.url
    ? { url: social.url, width: social.width || 1200, height: social.height || 630, alt: recipe.title }
    : recipe.mainImage
      ? {
          url: recipe.mainImage,
          width: recipe.mainImageWidth || 1200,
          height: recipe.mainImageHeight || 630,
          alt: recipe.title,
        }
      : null;

  return {
    title,
    description,
    alternates: { canonical },
    ...(recipe.authorName ? { authors: [{ name: recipe.authorName }] } : {}),
    ...(recipe.noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical) ?? canonical,
      siteName: siteDisplayName,
      type: "article",
      ...(recipe.publishedDate ? { publishedTime: recipe.publishedDate } : {}),
      ...(recipe.dateModified ? { modifiedTime: recipe.dateModified } : {}),
      ...(recipe.authorName ? { authors: [recipe.authorName] } : {}),
      ...(recipe.tags?.length ? { tags: recipe.tags } : {}),
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

const MORE_RECIPES_COUNT = 3;

export default async function RecipePage({ params }) {
  const { slug } = await params;

  const [recipe, allRecipes] = await Promise.all([getRecipeBySlug(slug), getRecipes()]);
  if (!recipe) notFound();

  const sameCategory = recipe.category?.slug
    ? allRecipes.filter((r) => r.slug !== slug && r.category?.slug === recipe.category.slug)
    : [];
  const moreRecipes = sameCategory.length >= MORE_RECIPES_COUNT
    ? pickRandomArticles(sameCategory, { count: MORE_RECIPES_COUNT })
    : pickRandomArticles(allRecipes, { count: MORE_RECIPES_COUNT, excludeSlug: slug });

  const canonicalRecipeUrl = `${siteConfig.siteUrl.replace(/\/$/, "")}/recipe/${slug}`;
  const heroImageUrl =
    recipe.socialImage?.url || recipe.heroImage?.url || recipe.mainImage || null;

  const recipeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: descriptionForRecipe(recipe),
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalRecipeUrl },
    url: canonicalRecipeUrl,
    ...(recipe.publishedDate ? { datePublished: recipe.publishedDate } : {}),
    ...(recipe.dateModified ? { dateModified: recipe.dateModified } : {}),
    ...(recipe.authorName ? { author: { "@type": "Person", name: recipe.authorName } } : {}),
    ...(recipe.category?.title ? { recipeCategory: recipe.category.title } : {}),
    ...(recipe.ingredients?.length ? { recipeIngredient: recipe.ingredients } : {}),
    ...(recipe.steps?.length
      ? {
          recipeInstructions: recipe.steps.map((step, index) => ({
            "@type": "HowToStep",
            position: index + 1,
            text: step,
          })),
        }
      : {}),
    ...(recipe.tags?.length ? { keywords: recipe.tags.join(", ") } : {}),
    publisher: {
      "@type": "Organization",
      name: siteDisplayName,
      url: siteConfig.siteUrl,
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
        name: "Recipes",
        item: `${siteConfig.siteUrl.replace(/\/$/, "")}/recipes`,
      },
      { "@type": "ListItem", position: 3, name: recipe.title, item: canonicalRecipeUrl },
    ],
  };

  return (
    <div className={styles.page}>
      <JsonLd data={recipeJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <SubscribedArticleView slug={slug} isJewishContent={recipe.isJewishContent} />
      <NavLogoImageSync image={recipe.mainImage} />
      <section className="articlebody-section">
        <div className={`${styles.articleHeroBlock} ${styles.articleHeroBlockInline}`}>
          <div className={styles.articleHero}>
            <div className={styles.articleHeroContent}>
              <div className="spacer-3rem" />
              <div className="headline-block">
                {recipe.category?.slug ? (
                  <Link
                    href={`/recipes/category/${recipe.category.slug}`}
                    className={styles.recipeCategoryKicker}
                  >
                    {recipe.category.title}
                  </Link>
                ) : null}
                <h1 className="headline-text">{recipe.title}</h1>
                {recipe.description ? (
                  <div className="subtitle-container">
                    <p>{recipe.description}</p>
                  </div>
                ) : null}
              </div>
              <div className={styles.recipeMetaRow}>
                {recipe.publishedDate ? (
                  <span className={styles.recipeMetaItem}>
                    {new Date(recipe.publishedDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                ) : null}
                <FavoriteButton slug={slug} />
              </div>
              {recipe.heroImage?.url ? (
                <div className={styles.leadImageSection}>
                  <div className={styles.leadImageFrame}>
                    <Image
                      src={recipe.heroImage.url}
                      alt={recipe.title}
                      width={recipe.heroImage.width || 1200}
                      height={recipe.heroImage.height || 800}
                      priority
                      className={styles.leadImage}
                      sizes="(max-width: 640px) 100vw, 640px"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className={`${styles.articleBodyGrid} ${styles.articleBodyGridBlocksFirst}`}>
          <div className={styles.articleMain}>
            <div className={styles.articleContainerNoPadding}>
              <div className="articlecopy-wrapper">
                <div className="articlecopy-richtext">
                  <article className={styles.recipeBody}>
                    <p className={styles.recipeNeedLine}>
                      <strong>What you&apos;ll need: </strong>
                      {recipe.equipment ? `${recipe.equipment}… also:` : "Just the basics:"}
                    </p>
                    <IngredientsChecklist ingredients={recipe.ingredients} />
                    {recipe.steps?.length ? (
                      <ol className={styles.recipeSteps}>
                        {recipe.steps.map((step, index) => (
                          <li key={index} className={styles.recipeStep}>
                            <strong>{index + 1}. </strong>
                            {step}
                          </li>
                        ))}
                      </ol>
                    ) : null}
                    {recipe.authorName ? (
                      <div className={styles.recipeAuthor}>
                        <p className={styles.recipeAuthorName}>Recipe by {recipe.authorName}</p>
                        {recipe.authorBio ? (
                          <p className={styles.recipeAuthorBio}>{recipe.authorBio}</p>
                        ) : null}
                      </div>
                    ) : null}
                    {recipe.funFact ? (
                      <aside className={styles.recipeFunFact}>
                        <p className={styles.recipeFunFactKicker}>Did you know…</p>
                        <p className={styles.recipeFunFactText}>{recipe.funFact}</p>
                      </aside>
                    ) : null}
                    {recipe.furtherReading?.length ? (
                      <section className={styles.recipeFurtherReading} aria-label="Further reading">
                        <h2 className={styles.recipeFurtherReadingTitle}>What else?</h2>
                        <ul className={styles.recipeFurtherReadingList}>
                          {recipe.furtherReading.map((item) => (
                            <li key={item._key ?? item.url} className={styles.recipeFurtherReadingItem}>
                              <p>{item.label}</p>
                              {item.url ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.recipeFurtherReadingLink}
                                >
                                  {item.sourceName || "Read more"} &gt;
                                </a>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </section>
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
              <AdSlot slotId={SLOT_RAIL} format="vertical" {...crossPromoForSlot("rail")} />
            </div>
          )}
        </div>
        {moreRecipes.length > 0 && (
          <div className={styles.readMoreOuter}>
            <section className={styles.readMore} aria-label="More recipes">
              <h2 className={styles.readMoreTitle}>
                {recipe.category?.title && sameCategory.length >= MORE_RECIPES_COUNT
                  ? `More ${recipe.category.title.toLowerCase()}`
                  : "More recipes"}
              </h2>
              <div className={styles.readMoreGrid}>
                {moreRecipes.map((rec) => (
                  <Link
                    key={rec._id ?? rec.slug}
                    href={`/recipe/${rec.slug}`}
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
                    {rec.description && <p className={styles.readMoreDek}>{rec.description}</p>}
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
