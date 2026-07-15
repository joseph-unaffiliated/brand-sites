import { getSlangEntries } from "@/lib/slang";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import WordCard from "@/components/WordCard";
import { siteDisplayName } from "@/config/site";
import styles from "./page.module.css";

export const metadata = {
  title: `Words | ${siteDisplayName}`,
  description: `Browse the full Dictionary of Slang from ${siteDisplayName}. Newest first.`,
  alternates: { canonical: "/archive" },
  openGraph: {
    title: `Words | ${siteDisplayName}`,
    description: `Browse the full Dictionary of Slang from ${siteDisplayName}. Newest first.`,
    url: "/archive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Words | ${siteDisplayName}`,
    description: `Browse the full Dictionary of Slang from ${siteDisplayName}. Newest first.`,
  },
};

export default async function ArchivePage() {
  const entries = await getSlangEntries();

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Archive</p>
            <h1>Every word so far</h1>
          </div>
        </header>

        <div className={styles.issueMosaic}>
          {entries.map((entry) => (
            <WordCard key={entry._id ?? entry.slug} entry={entry} />
          ))}
          <HideWhenSubscribed>
            <article className={styles.issueCard}>
              <div className={styles.issueCardPlaceholder}>
                <div className={styles.issueCardBody}>
                  <p className={styles.issueDate}>—</p>
                  <h3>More words coming soon</h3>
                  <p className={styles.issueDek}>
                    New words drop weekly. Subscribe to get them in your inbox.
                  </p>
                  <a className={styles.issueCta} href="/#subscribe">
                    Subscribe
                  </a>
                </div>
              </div>
            </article>
          </HideWhenSubscribed>
        </div>
      </div>
    </div>
  );
}
