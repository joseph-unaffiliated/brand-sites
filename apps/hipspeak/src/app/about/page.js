import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../basic-page.module.css";
import aboutStyles from "./page.module.css";
import articleStyles from "../word/[slug]/page.module.css";
import AboutOutreach from "./AboutOutreach";
import { siteDisplayName } from "@/config/site";
import { getSlangEntries } from "@/lib/slang";
import { pickRandomArticles } from "@/lib/pickRandomArticles";

export const metadata = {
  title: `About | ${siteDisplayName}`,
  description: `About ${siteDisplayName} — The Dictionary of Slang. One word a week, decoded.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — The Dictionary of Slang. One word a week, decoded.`,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDisplayName}`,
    description: `About ${siteDisplayName} — The Dictionary of Slang. One word a week, decoded.`,
  },
};

const READ_MORE_COUNT = 3;

export default async function AboutPage() {
  const entries = await getSlangEntries();
  const readMore = pickRandomArticles(entries, { count: READ_MORE_COUNT });

  return (
    <>
      <div className={styles.page}>
        <div className={aboutStyles.aboutOuter}>
          <div className={aboutStyles.aboutLayout}>
            <div className={aboutStyles.aboutMain}>
              <h1 className={aboutStyles.aboutTitle}>About {siteDisplayName}</h1>
              <p>
                Welcome to {siteDisplayName}, a weekly email that unpacks the slang your kids
                (or your coworkers) are already using — so you can keep up without cringing.
              </p>
              <p>
                Each issue is one word: how it sounds, what it means in practice, an example
                in the wild, and a quick pop quiz. No homework. Just the Dictionary of Slang
                delivered to your inbox.
              </p>

              <h2>What we publish</h2>
              <p>
                One entry a week. A pronunciation, a plain-English definition, a{" "}
                <em>Think:</em> line you can actually remember, an in-use example, and a
                quick quiz. We skip the 2,000-word origin essay. The publicly available
                word pages are the full record — browse them anytime in the{" "}
                <Link href="/archive">archive</Link>.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new word arrives each week. Save favorites to{" "}
                <Link href="/my-words">My words</Link>. Take the{" "}
                <Link href="/quiz">slang quiz</Link> when you want to check whether
                you&apos;re fluent or just vibing. Snooze and unsubscribe stay a click
                away in every email.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Parents, managers, and anyone who has nodded along in a conversation
                they did not fully understand. If you&apos;ve ever googled a word after
                a group chat, you&apos;re in the right place.
              </p>

              <h2>Get in touch</h2>
              <p>
                Got a word we should unpack? Hit reply on any issue, or use the
                contact link below.
              </p>
              <Suspense fallback={null}>
                <AboutOutreach />
              </Suspense>
            </div>
            <aside
              className={aboutStyles.aboutPhoneAside}
              aria-label="Hipspeak on a phone"
            >
              <Image
                src="/hip-phone.png"
                alt="Hipspeak on a phone"
                width={800}
                height={1600}
                className={aboutStyles.aboutPhoneImage}
                sizes="(min-width: 900px) 420px, min(92vw, 360px)"
                priority
              />
            </aside>
          </div>
        </div>
      </div>

      {readMore.length > 0 ? (
        <div className={articleStyles.readMoreOuter}>
          <section className={articleStyles.readMore} aria-label="Sample words">
            <h2 className={articleStyles.readMoreTitle}>Start here</h2>
            <div className={articleStyles.readMoreGrid}>
              {readMore.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/word/${entry.slug}`}
                  className={articleStyles.readMoreCard}
                >
                  <div className={articleStyles.readMoreThumb}>
                    <Image
                      src={entry.mainImage}
                      alt=""
                      width={280}
                      height={187}
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                  </div>
                  <h3 className={articleStyles.readMoreHeadline}>{entry.title}</h3>
                  {entry.think ? (
                    <p className={articleStyles.readMoreDek}>{entry.think}</p>
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
