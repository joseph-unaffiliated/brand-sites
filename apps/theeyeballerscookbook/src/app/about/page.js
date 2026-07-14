import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../basic-page.module.css";
import aboutStyles from "./page.module.css";
import articleStyles from "../recipe/[slug]/page.module.css";
import AboutOutreach from "./AboutOutreach";
import { siteDisplayName } from "@/config/site";
import { getRecipes } from "@/lib/recipes";
import { pickRandomArticles } from "@/lib/pickRandomArticles";

export const metadata = {
  title: `About | ${siteDisplayName}`,
  description: `About ${siteDisplayName} — a weekly email series of simple recipes with no measurements.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — a weekly email series of simple recipes with no measurements.`,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — a weekly email series of simple recipes with no measurements.`,
  },
};

const TRY_RECIPE_COUNT = 3;

export default async function AboutPage() {
  const allRecipes = await getRecipes();
  const tryNext = pickRandomArticles(allRecipes, { count: TRY_RECIPE_COUNT });

  return (
    <>
      <div className={styles.page}>
        <div className={aboutStyles.aboutOuter}>
          <div className={aboutStyles.aboutLayout}>
            <div className={aboutStyles.aboutMain}>
              <h1 className={aboutStyles.aboutTitle}>About {siteDisplayName}</h1>
              <p>
                Welcome to {siteDisplayName}, a weekly email series of recipes
                without measurements.
              </p>
              <p>
                We know what you&apos;re thinking: &ldquo;No measurements? None?
                Not even a teaspoon?&rdquo; That&apos;s right. Not even a
                teaspoon.
              </p>
              <p>
                Most home cooking doesn&apos;t need a scale. It needs a few
                good ingredients, a hot pan, and the confidence to eyeball it.
                Some potatoes, a couple of onions, a few glugs of soy sauce —
                you already know roughly how much. Our recipes lean into that:
                short ingredient lists, three or four steps, and food that
                comes out great even when your &ldquo;some&rdquo; is different
                from ours.
              </p>

              <h2>What we publish</h2>
              <p>
                Each edition is <strong>one recipe you can actually make</strong> —
                a short list of what you&apos;ll need, a few numbered steps, a
                food fact worth repeating at the table, and a couple of links
                if you want to go deeper. No life story before the recipe, no
                ads dressed up as instructions.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new recipe arrives in your inbox each
                week. Browsing past recipes on the site is free anytime — by
                category, or straight through the whole cookbook. Tap the ♡
                on any recipe to save it to your favorites. Snooze and
                unsubscribe stay a click away in your mail when you need them.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Anyone who cooks by feel — or wants to learn to. If a recipe
                that calls for &ldquo;2.4 grams of kosher salt&rdquo; makes
                your eyes glaze over, you&apos;re in the right place.
              </p>

              <h2>Get in touch</h2>
              <Suspense fallback={null}>
                <AboutOutreach />
              </Suspense>
            </div>

            <aside
              className={aboutStyles.aboutPhoneAside}
              aria-label="Newsletter in your inbox"
            >
              <Image
                src="/tec-phone.png"
                alt="Example of a published recipe in an email, shown on a phone"
                width={800}
                height={1600}
                className={aboutStyles.aboutPhoneImage}
                sizes="(min-width: 900px) 420px, min(92vw, 360px)"
              />
            </aside>
          </div>
        </div>
      </div>

      {tryNext.length > 0 ? (
        <div className={articleStyles.readMoreOuter}>
          <section className={articleStyles.readMore} aria-label="Try a recipe">
            <div className={articleStyles.readMoreGrid}>
              {tryNext.map((rec) => (
                <Link
                  key={rec._id ?? rec.slug}
                  href={`/recipe/${rec.slug}`}
                  className={articleStyles.readMoreCard}
                >
                  <div className={articleStyles.readMoreThumb}>
                    <Image
                      src={rec.mainImage}
                      alt={rec.title}
                      width={280}
                      height={187}
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                  </div>
                  <h3 className={articleStyles.readMoreHeadline}>{rec.title}</h3>
                  {rec.description ? (
                    <p className={articleStyles.readMoreDek}>{rec.description}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
