"use client";

import Link from "next/link";
import { useSubscriber } from "@/context/SubscriberContext";
import { cardPronunciation } from "@/lib/pronunciation";
import styles from "../app/page.module.css";

const SNIPPETS_SIGNED_OUT = 2;
const SNIPPETS_SIGNED_IN = 5;

export default function HomeSnippetsList({ stackItems }) {
  const { isSubscribed } = useSubscriber();
  const count = isSubscribed ? SNIPPETS_SIGNED_IN : SNIPPETS_SIGNED_OUT;
  const items = (stackItems ?? []).slice(0, count);

  return (
    <div className={styles.snippetsList}>
      <p className={styles.snippetsListTitle}>More words</p>
      {items.map((entry) => (
        <Link
          key={entry._id ?? entry.slug}
          href={`/word/${entry.slug}`}
          className={styles.snippetItem}
        >
          <span className={styles.snippetItemText}>
            <span className={styles.snippetTitle}>{entry.title}</span>
            {cardPronunciation(entry.pronunciation) && (
              <span className={styles.snippetDemographic}>
                {cardPronunciation(entry.pronunciation)}
              </span>
            )}
            {entry.think && (
              <span className={styles.snippetSummary}>{entry.think}</span>
            )}
          </span>
        </Link>
      ))}
      <Link href="/archive" className={styles.snippetArchive}>
        See full archive
      </Link>
    </div>
  );
}
