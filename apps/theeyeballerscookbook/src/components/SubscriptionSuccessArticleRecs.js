import Image from "next/image";
import Link from "next/link";
import articleStyles from "@/app/recipe/[slug]/page.module.css";
import actions from "./SubscriptionPageActions.module.css";

/**
 * @param {{ articles: Array<{ _id?: string, slug: string, title: string, description?: string, mainImage: string }> }} props
 */
export default function SubscriptionSuccessArticleRecs({ articles }) {
  if (!articles?.length) return null;

  return (
    <div className={`${articleStyles.readMoreOuter} ${actions.articleRecsOuter}`}>
      <section
        className={`${articleStyles.readMore} ${actions.articleRecs}`}
        aria-label="Try a recipe"
      >
        <div className={articleStyles.readMoreGrid}>
          {articles.map((rec) => (
            <Link
              key={rec._id ?? rec.slug}
              href={`/recipe/${rec.slug}`}
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
              <h3 className={articleStyles.readMoreHeadline}>{rec.title}</h3>
              {rec.description ? (
                <p className={articleStyles.readMoreDek}>{rec.description}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
