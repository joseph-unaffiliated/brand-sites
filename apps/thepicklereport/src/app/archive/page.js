import Link from "next/link";
import { getArticles, ensureDescriptionOnly } from "@/lib/articles";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import styles from "./page.module.css";

export default async function ArchivePage() {
  const articles = await getArticles();

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Archive</p>
            <h1>Past issues</h1>
            <p>
              Browse the full library of The Pickle Report issues. Each entry
              includes a summary, themes, and links.
            </p>
          </div>
        </header>

        <div className={styles.issueList}>
          {articles.map((article) => (
            <article className={styles.issueCard} key={article.slug}>
              <div>
                <p className={styles.issueDate}>
                  {article.publishedDate
                    ? new Date(article.publishedDate).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" }
                      )
                    : "—"}
                </p>
                <h3>{article.title}</h3>
                <p>{ensureDescriptionOnly(article.summary || article.subtitle) || article.summary || article.subtitle}</p>
              </div>
              <Link className={styles.readLink} href={`/article/${article.slug}`}>
                Read issue →
              </Link>
            </article>
          ))}
          <HideWhenSubscribed>
            <article className={styles.issueCard}>
              <div>
                <p className={styles.issueDate}>—</p>
                <h3>More issues coming soon</h3>
                <p>New issues drop weekly. Subscribe to get them in your inbox.</p>
              </div>
              <a className={styles.readLink} href="/#subscribe">
                Subscribe →
              </a>
            </article>
          </HideWhenSubscribed>
        </div>
      </div>
    </div>
  );
}
