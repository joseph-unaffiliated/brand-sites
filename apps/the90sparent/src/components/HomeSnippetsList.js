"use client";

import Image from "next/image";
import Link from "next/link";
import { useSubscriber } from "@/context/SubscriberContext";
import { getDemographicAndDescription } from "@/lib/articles";
import styles from "../app/page.module.css";

const SNIPPETS_SIGNED_OUT = 3;
const SNIPPETS_SIGNED_IN = 6;

export default function HomeSnippetsList({ stackItems }) {
  const { isSubscribed } = useSubscriber();
  const count = isSubscribed ? SNIPPETS_SIGNED_IN : SNIPPETS_SIGNED_OUT;
  const items = (stackItems ?? []).slice(0, count);

  return (
    <div className={styles.snippetsList}>
      <p className={styles.snippetsListTitle}>More issues</p>
      {items.map((article) => {
        const { demographic, description } = getDemographicAndDescription(article);
        return (
          <Link
            key={article._id ?? article.slug}
            href={`/article/${article.slug}`}
            className={styles.snippetItem}
          >
            <span className={styles.snippetItemText}>
              <span className={styles.snippetTitle}>{article.title}</span>
              {demographic && (
                <span className={styles.snippetDemographic}>{demographic}</span>
              )}
              {description && (
                <span className={styles.snippetSummary}>{description}</span>
              )}
            </span>
            <span className={styles.snippetThumb}>
              <Image
                src={article.mainImage}
                alt=""
                width={72}
                height={72}
                sizes="72px"
              />
            </span>
          </Link>
        );
      })}
      <Link href="/archive" className={styles.snippetArchive}>
        See full archive
      </Link>
    </div>
  );
}
