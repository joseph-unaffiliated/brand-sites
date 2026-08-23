import { getSlangEntries } from "@/lib/slang";
import WordsBrowser from "@/components/WordsBrowser";
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
            <h1>The Dictionary of Slang</h1>
          </div>
        </header>

        <WordsBrowser entries={entries} />
      </div>
    </div>
  );
}
