import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import RecommendedArticleCards from "@/components/RecommendedArticleCards";
import articleStyles from "./article/[slug]/page.module.css";
import styles from "./not-found.module.css";

const SUGGESTED_COUNT = 3;

export default async function NotFound() {
  const allArticles = await getArticles();
  const suggested = pickRandomArticles(allArticles, { count: SUGGESTED_COUNT });

  return (
    <div className={articleStyles.page}>
      <section className="articlebody-section">
        <div className={styles.top}>
          <div className={styles.card}>
            <h1 className={styles.heading}>Page not found.</h1>
            <p className={styles.body}>
              The page you are looking for does not exist or may have moved.
            </p>
            <div className={styles.actions}>
              <Link className="button button-secondary" href="/">
                Go home
              </Link>
              <Link className="button button-secondary" href="/archive">
                Browse archive
              </Link>
            </div>
          </div>
        </div>

        <RecommendedArticleCards
          articles={suggested}
          title={null}
          ariaLabel="Suggested issues"
        />
      </section>
    </div>
  );
}
