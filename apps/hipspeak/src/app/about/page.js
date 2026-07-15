import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../basic-page.module.css";
import aboutStyles from "./page.module.css";
import archiveStyles from "../archive/page.module.css";
import AboutOutreach from "./AboutOutreach";
import { siteDisplayName } from "@/config/site";
import { getSlangEntries } from "@/lib/slang";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import WordCard from "@/components/WordCard";

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
              <h2>How it works</h2>
              <p>
                Subscribe once, and a new word arrives each week. Browse past entries in the{" "}
                <Link href="/archive">archive</Link> anytime, and save favorites to{" "}
                <Link href="/my-words">My words</Link>.
              </p>
              <p>
                Got a word we should unpack? Hit reply on any issue, or{" "}
                <Link href="/contact">get in touch</Link>.
              </p>
              <h2>Get in touch</h2>
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
        <section className={archiveStyles.archive} aria-label="Sample words">
          <h2 className={aboutStyles.aboutTitle}>Start here</h2>
          <div className={archiveStyles.issueGrid}>
            {readMore.map((entry) => (
              <WordCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
