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
  description: `About ${siteDisplayName} — a weekly email series with honest dating stories and sharp takes on modern love.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — a weekly email series with honest dating stories and sharp takes on modern love.`,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — a weekly email series with honest dating stories and sharp takes on modern love.`,
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
                Welcome to {siteDisplayName}, a weekly email series for anyone navigating dating
                today—situationships, soft launches, hard conversations, and the occasional triumph.
              </p>
              <p>
                We know what you&apos;re thinking: &ldquo;Another newsletter about dating?&rdquo; Fair.
                But this one is built for readers who want more nuance than a hot take and more heart
                than a listicle.
              </p>
              <p>
                Each edition is <strong>one focused issue you can finish</strong>—anonymous stories,
                honest confessions, and the kind of detail you&apos;d only tell your closest friend.
                A readable break from the infinite scroll, delivered to your inbox.
              </p>

              <h2>What we publish</h2>
              <p>
                True stories about love, intimacy, and modern romance—plus sharp context on the apps,
                mixed signals, and everything in between. No manifestos—just real talk, one issue at
                a time.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new issue arrives in your inbox each week—one focused read you
                can actually finish. Browsing past articles in the archive is free anytime. Snooze and
                unsubscribe stay a click away in your mail when you need them.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Anyone who wants honest dating stories without the performance—whether you&apos;re
                single, coupled, or somewhere gloriously in between.
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
                src="/tkat-phone.png"
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
