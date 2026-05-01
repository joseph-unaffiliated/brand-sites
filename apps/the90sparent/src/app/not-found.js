import Image from "next/image";
import Link from "next/link";
import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import { siteKickerLower } from "@/config/site";
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

        {suggested.length > 0 && (
          <div className={articleStyles.readMoreOuter}>
            <section className={articleStyles.readMore} aria-label="Suggested issues">
              <div className={articleStyles.readMoreGrid}>
                {suggested.map((rec) => (
                  <Link
                    key={rec._id ?? rec.slug}
                    href={`/article/${rec.slug}`}
                    className={articleStyles.readMoreCard}
                  >
                    <div className={articleStyles.readMoreThumb}>
                      <Image
                        src={rec.mainImage}
                        alt=""
                        width={280}
                        height={187}
                        sizes="(max-width: 640px) 100vw, 280px"
                      />
                    </div>
                    {rec.kicker && rec.kicker.trim().toLowerCase() !== siteKickerLower && (
                      <p className={articleStyles.readMoreKicker}>{rec.kicker}</p>
                    )}
                    <h3 className={articleStyles.readMoreHeadline}>{rec.title}</h3>
                    {rec.summary && <p className={articleStyles.readMoreDek}>{rec.summary}</p>}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}
