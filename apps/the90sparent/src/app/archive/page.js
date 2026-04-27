import Image from "next/image";
import Link from "next/link";
import { getArticles, ensureDescriptionOnly } from "@/lib/articles";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import styles from "./page.module.css";

function publishedTime(article) {
  if (!article?.publishedDate) return null;
  const t = new Date(article.publishedDate).getTime();
  return Number.isNaN(t) ? null : t;
}

/** Newest first; undated / invalid dates last, stable for ties. */
function sortByPublishedDateDesc(a, b) {
  const ta = publishedTime(a);
  const tb = publishedTime(b);
  if (ta != null && tb != null && ta !== tb) return tb - ta;
  if (ta != null && tb == null) return -1;
  if (ta == null && tb != null) return 1;
  return String(a?.slug || "").localeCompare(String(b?.slug || ""));
}

export default async function ArchivePage() {
  const articles = (await getArticles()).slice().sort(sortByPublishedDateDesc);

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Archive</p>
            <h1>Past issues</h1>
            <p>Browse the full library of articles</p>
          </div>
        </header>

        <div className={styles.issueMosaic}>
          {articles.map((article) => (
            <article className={styles.issueCard} key={article._id ?? article.slug}>
              <Link href={`/article/${article.slug}`} className={styles.issueCardLink}>
                <div className={styles.issueCardImage}>
                  <Image
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
                  <p className={styles.issueDek}>
                    {ensureDescriptionOnly(article.summary || article.subtitle) ||
                      article.summary ||
                      article.subtitle}
                  </p>
                  <span className={styles.issueCta}>
                    <span>Read issue</span>
                    <span className={styles.issueCtaArrow} aria-hidden>
                      <svg
                        width="7"
                        height="6"
                        viewBox="0 0 7 6"
                        fill="none"
                        role="presentation"
                        focusable="false"
                      >
                        <path
                          d="M0 2.91722H6.01145M6.01145 2.91722L3.44774 0.353516M6.01145 2.91722L3.44774 5.48093"
                          stroke="currentColor"
                        />
                      </svg>
                    </span>
                  </span>
                </div>
              </Link>
            </article>
          ))}
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
                    <span>Subscribe</span>
                    <span className={styles.issueCtaArrow} aria-hidden>
                      <svg
                        width="7"
                        height="6"
                        viewBox="0 0 7 6"
                        fill="none"
                        role="presentation"
                        focusable="false"
                      >
                        <path
                          d="M0 2.91722H6.01145M6.01145 2.91722L3.44774 0.353516M6.01145 2.91722L3.44774 5.48093"
                          stroke="currentColor"
                        />
                      </svg>
                    </span>
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
