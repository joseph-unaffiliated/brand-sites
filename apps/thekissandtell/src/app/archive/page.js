import Link from "next/link";
import SanityMedia from "@/components/SanityMedia";
import { getArticles, getDemographicAndDescription } from "@/lib/articles";
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
          </div>
        </header>

        <div className={styles.issueMosaic}>
          {articles.map((article) => {
            const { demographic, description } = getDemographicAndDescription(article);
            return (
              <article className={styles.issueCard} key={article._id ?? article.slug}>
                <Link href={`/article/${article.slug}`} className={styles.issueCardLink}>
                  <div className={styles.issueCardImage}>
                    <SanityMedia
                      src={article.mainImage}
                      alt=""
                      width={400}
                      height={267}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className={styles.issueCardBody}>
                    <p className={styles.issueDate}>
                      {article.publishedDate
                        ? new Date(article.publishedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                    <h3>{article.title}</h3>
                    {demographic && (
                      <p className={styles.issueDemographic}>{demographic}</p>
                    )}
                    {description && (
                      <p className={styles.issueDek}>{description}</p>
                    )}
                    <span className={styles.issueCta}>Read issue</span>
                  </div>
                </Link>
              </article>
            );
          })}
          <HideWhenSubscribed>
            <article className={styles.issueCard}>
              <div className={styles.issueCardPlaceholder}>
                <div className={styles.issueCardBody}>
                  <p className={styles.issueDate}>—</p>
                  <h3>More issues coming soon</h3>
                  <p className={styles.issueDek}>
                    New issues drop weekly. Subscribe to get them in your inbox.
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
