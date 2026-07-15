import Link from "next/link";
import { getSlangEntries } from "@/lib/slang";
import MyWordsList from "./MyWordsList";
import { siteDisplayName } from "@/config/site";
import styles from "../archive/page.module.css";

export const metadata = {
  title: `My words | ${siteDisplayName}`,
  description: `Words you've saved from ${siteDisplayName}.`,
  alternates: { canonical: "/my-words" },
  robots: { index: false },
};

export default async function MyWordsPage() {
  const entries = await getSlangEntries();

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>
              <Link href="/archive" className={styles.kickerLink}>
                Words
              </Link>
            </p>
            <h1>My words</h1>
          </div>
        </header>
        <MyWordsList entries={entries} />
      </div>
    </div>
  );
}
