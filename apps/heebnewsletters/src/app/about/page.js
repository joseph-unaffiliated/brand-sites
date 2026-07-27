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
  description: `About ${siteDisplayName} — the 2000s in your inbox, one dug-up piece of Jewish counter-culture nostalgia at a time.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — the 2000s in your inbox, one dug-up piece of Jewish counter-culture nostalgia at a time.`,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — the 2000s in your inbox, one dug-up piece of Jewish counter-culture nostalgia at a time.`,
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
                Welcome to {siteDisplayName} — the 2000s in your inbox. Every
                week we dig up a piece of subversive Jewish counter-culture
                media from the 2000s and hand it back to you with the
                context, commentary, and side-eye it deserves.
              </p>
              <p>
                Heeb Magazine spent the 2000s pissing off the right people:
                too Jewish for the mainstream, too irreverent for the
                establishment, too funny to ignore. From the Vault reopens
                that archive — pages, columns, photo shoots, and ephemera
                that never should have been forgotten.
              </p>

              <blockquote className={aboutStyles.aboutEraPull}>
                <p className={aboutStyles.aboutEraPullText}>
                  &ldquo;Not your bubbe&apos;s Judaism.&rdquo;
                </p>
              </blockquote>

              <p>
                For our small team, this isn&apos;t nostalgia for nostalgia&apos;s
                sake — it&apos;s a reminder that Jewish culture has always been
                loud, funny, a little offensive, and unmistakably itself.
                Every issue is a time capsule with a point of view.
              </p>

              <h2>What we publish</h2>
              <p>
                Each issue is <strong>one dug-up piece of the vault</strong>—an
                editor&apos;s intro framing the piece, the original page or
                article reproduced in full, era context, and a Rabbit Hole of
                curated links for when you inevitably fall down the internet
                afterward. A readable break from the infinite scroll,
                delivered to your inbox.
              </p>
              <p>
                We cover Jewish counter-culture from the 2000s in all its
                forms: magazine pages, message-board ephemera, early internet
                Jewish humor, and the subcultures that Heeb Magazine helped
                define. No manifestos — just the good, weird, funny stuff.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new issue arrives in your inbox each
                week — one focused read you can actually finish. Browsing past
                issues in the archive is free anytime. Snooze and unsubscribe
                stay a click away in your mail when you need them.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Heeb readers who never got over it, Jews who want their
                culture with an edge, and anyone curious what &ldquo;too Jewish
                for the mainstream&rdquo; actually looked like in print. If
                you remember Heeb Magazine — or wish you did — you&apos;re in
                the right place.
              </p>

              <h2>Get in touch</h2>
              <Suspense fallback={null}>
                <AboutOutreach />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {readMore.length > 0 ? (
        <div className={articleStyles.readMoreOuter}>
          <section className={articleStyles.readMore} aria-label="From the Vault">
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
