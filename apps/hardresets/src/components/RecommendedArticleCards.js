import Image from "next/image";
import Link from "next/link";
import { bodyExcerptFromArticle } from "@/lib/articles";
import { siteKickerLower } from "@/config/site";
import styles from "@/app/article/[slug]/page.module.css";

/**
 * Shared “Keep reading” / suggested-article grid (image, subject, title, body excerpt).
 *
 * @param {{
 *   articles: Array<{
 *     _id?: string;
 *     slug?: string;
 *     title?: string;
 *     kicker?: string;
 *     subjectName?: string | null;
 *     subjectColor?: string | null;
 *     summary?: string;
 *     mainImage?: string;
 *     contentBlocks?: unknown[];
 *     entries?: unknown[];
 *     subtitle?: string;
 *   }>;
 *   title?: string | null;
 *   ariaLabel?: string;
 * }} props
 */
export default function RecommendedArticleCards({
  articles,
  title = "Keep reading",
  ariaLabel = "Keep reading",
}) {
  if (!Array.isArray(articles) || articles.length === 0) return null;

  return (
    <div className={styles.readMoreOuter}>
      <section className={styles.readMore} aria-label={ariaLabel}>
        {title ? <h2 className={styles.readMoreTitle}>{title}</h2> : null}
        <div className={styles.readMoreGrid}>
          {articles.map((rec) => {
            const excerpt = bodyExcerptFromArticle(rec, 2);
            return (
              <Link
                key={rec._id ?? rec.slug}
                href={`/article/${rec.slug}`}
                className={styles.readMoreCard}
              >
                <div className={styles.readMoreThumb}>
                  <Image
                    src={rec.mainImage}
                    alt={rec.title || ""}
                    width={280}
                    height={187}
                    sizes="(max-width: 640px) 100vw, 280px"
                  />
                </div>
                {rec.kicker && rec.kicker.trim().toLowerCase() !== siteKickerLower ? (
                  <p className={styles.readMoreKicker}>{rec.kicker}</p>
                ) : null}
                <h3 className={styles.readMoreHeadline}>{rec.title}</h3>
                {rec.subjectName ? (
                  <p
                    className={styles.readMoreSubject}
                    style={rec.subjectColor ? { color: rec.subjectColor } : undefined}
                  >
                    {rec.subjectName}
                  </p>
                ) : null}
                {excerpt ? (
                  <p className={styles.readMoreExcerpt}>{excerpt}</p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
