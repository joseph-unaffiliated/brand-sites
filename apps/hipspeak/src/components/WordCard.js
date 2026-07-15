import Image from "next/image";
import Link from "next/link";
import MyWordButton from "@/components/MyWordButton";
import { formatSlangDate } from "@/lib/slang";
import styles from "@/app/archive/page.module.css";

export default function WordCard({ entry }) {
  return (
    <article className={styles.issueCard}>
      <Link href={`/word/${entry.slug}`} className={styles.issueCardLink}>
        <div className={styles.issueCardImage}>
          <Image
            src={entry.mainImage}
            alt=""
            width={400}
            height={267}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className={styles.issueCardBody}>
          <div className={styles.wordCardMeta}>
            <p className={styles.issueDate}>
              {formatSlangDate(entry.publishedDate) ?? "—"}
            </p>
            <MyWordButton slug={entry.slug} variant="card" />
          </div>
          <h3>{entry.title}</h3>
          {entry.pronunciation ? (
            <p className={styles.wordPronunciation}>{entry.pronunciation}</p>
          ) : null}
          {entry.think ? (
            <p className={styles.issueDek}>Think: {entry.think}</p>
          ) : null}
          <span className={styles.issueCta}>Get the word</span>
        </div>
      </Link>
    </article>
  );
}
