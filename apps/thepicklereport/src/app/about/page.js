import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../basic-page.module.css";
import aboutStyles from "./page.module.css";
import articleStyles from "../article/[slug]/page.module.css";
import AboutOutreach from "./AboutOutreach";
import { siteDisplayName } from "@/config/site";
import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";

export const metadata = {
  title: `About | ${siteDisplayName}`,
  description: `About ${siteDisplayName} — a weekly email series with all the pickle related content you'll ever need.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — a weekly email series with all the pickle related content you'll ever need.`,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — a weekly email series with all the pickle related content you'll ever need.`,
  },
};

const READ_MORE_COUNT = 3;

export default async function AboutPage() {
  const allArticles = await getArticles();
  const readMore = pickRandomArticles(allArticles, { count: READ_MORE_COUNT });

  return (
    <>
      <div className={styles.page}>
        <div className={aboutStyles.aboutOuter}>
          <div className={aboutStyles.aboutLayout}>
            <div className={aboutStyles.aboutMain}>
              <h1 className={aboutStyles.aboutTitle}>About {siteDisplayName}</h1>
              <p>
                Welcome to {siteDisplayName}, a weekly email series with all the pickle
                related content you&apos;ll ever need.
              </p>
              <p>
                We know what you&apos;re thinking: &ldquo;Really? A publication about
                pickles? How long can they realistically keep this up?&rdquo; and also
                &ldquo;Why?&rdquo;
              </p>
              <figure className={aboutStyles.aboutFigure}>
                <Image
                  src="/images/about/pickle-jar-inline.gif"
                  alt="Close-up of a pickle and dill in brine inside a glass jar"
                  width={640}
                  height={428}
                  unoptimized
                  className={aboutStyles.aboutFigureImage}
                  sizes="(min-width: 900px) 480px, 100vw"
                />
              </figure>
              <p>
                For our small team, pickles are a connection to our heritage, a shared
                language that ties us to the past and binds us across cultures. They serve
                as a reminder that even from salty brine, given time and the appropriate
                conditions, something incredible can emerge… 🥸
              </p>
              <p>
                But more than that, we&apos;re here because it brings us joy. We do it for
                the fun of it, and we hope it brings you joy as well.
              </p>

              <h2>What we publish</h2>
              <p>
                Each edition is <strong>one full issue you can finish</strong>—reporting,
                commentary, Pickle Economics, internet finds in Nibbles, a Sexy Pic(kle) of
                the Week, and a trivia question to settle at the dinner table. A readable
                break from the infinite scroll, delivered to your inbox.
              </p>
              <p>
                We write about pickle culture, brine debates, regional rivalries, pantry
                staples, and the weirdly wonderful stories orbiting the humble pickle. No
                manifestos—just the good stuff, salted and fermented to taste.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new issue arrives in your inbox each week—one focused
                read you can actually finish. Browsing past articles in the archive is free
                anytime. Snooze and unsubscribe stay a click away in your mail when you
                need them.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Pickle obsessives, curious food nerds, and anyone who wants a weekly dose of
                delightfully specific joy in their inbox. If you&apos;ve ever had a strong
                opinion about dill vs. bread-and-butter, you&apos;re in the right place.
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
                src="/tpr-phone.png"
                alt="Example of a published issue in an email, shown on a phone"
                width={800}
                height={1600}
                className={aboutStyles.aboutPhoneImage}
                sizes="(min-width: 900px) 420px, min(92vw, 360px)"
              />
            </aside>
          </div>
        </div>
      </div>

      {readMore.length > 0 ? (
        <div className={articleStyles.readMoreOuter}>
          <section className={articleStyles.readMore} aria-label="Keep reading">
            <div className={articleStyles.readMoreGrid}>
              {readMore.map((rec) => (
                <Link
                  key={rec._id ?? rec.slug}
                  href={`/article/${rec.slug}`}
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
                  {rec.summary ? (
                    <p className={articleStyles.readMoreDek}>{rec.summary}</p>
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
