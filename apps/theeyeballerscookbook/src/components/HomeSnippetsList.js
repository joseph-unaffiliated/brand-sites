"use client";

import Image from "next/image";
import Link from "next/link";
import { useSubscriber } from "@/context/SubscriberContext";
import styles from "../app/page.module.css";

const SNIPPETS_SIGNED_OUT = 2;
const SNIPPETS_SIGNED_IN = 5;

export default function HomeSnippetsList({ stackItems }) {
  const { isSubscribed } = useSubscriber();
  const count = isSubscribed ? SNIPPETS_SIGNED_IN : SNIPPETS_SIGNED_OUT;
  const items = (stackItems ?? []).slice(0, count);

  return (
    <div className={styles.snippetsList}>
      <p className={styles.snippetsListTitle}>More recipes</p>
      {items.map((recipe) => (
        <Link
          key={recipe._id ?? recipe.slug}
          href={`/recipe/${recipe.slug}`}
          className={styles.snippetItem}
        >
          <span className={styles.snippetItemText}>
            <span className={styles.snippetTitle}>{recipe.title}</span>
            {recipe.category?.title && (
              <span className={styles.snippetDemographic}>{recipe.category.title}</span>
            )}
            {recipe.description && (
              <span className={styles.snippetSummary}>{recipe.description}</span>
            )}
          </span>
          <span className={styles.snippetThumb}>
            <Image
              src={recipe.mainImage}
              alt=""
              width={72}
              height={72}
              sizes="72px"
            />
          </span>
        </Link>
      ))}
      <Link href="/recipes" className={styles.snippetArchive}>
        Browse all recipes
      </Link>
    </div>
  );
}
