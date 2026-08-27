import Image from "next/image";
import Link from "next/link";
import MyWordButton from "@/components/MyWordButton";
import styles from "@/app/archive/page.module.css";

const PLACEHOLDER_COLORS = [
  "#3B82F6",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#F43F5E",
  "#14B8A6",
];

function placeholderColor(slug) {
  let hash = 0;
  for (let i = 0; i < (slug || "").length; i += 1) {
    hash = (hash + slug.charCodeAt(i) * (i + 1)) % PLACEHOLDER_COLORS.length;
  }
  return PLACEHOLDER_COLORS[hash];
}

export default function WordCard({ entry }) {
  const href = entry.href === null ? null : entry.href || `/word/${entry.slug}`;
  const hasImage = Boolean(entry.mainImage);

  const media = (
    <div
      className={styles.issueCardImage}
      style={!hasImage ? { background: placeholderColor(entry.slug) } : undefined}
    >
      {hasImage ? (
        <Image
          src={entry.mainImage}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
        />
      ) : (
        <p className={styles.wordCardPlaceholderTitle}>{entry.title}</p>
      )}
      <div className={styles.wordCardHeart}>
        <MyWordButton slug={entry.slug} variant="card" />
      </div>
    </div>
  );

  const body = (
    <div className={styles.issueCardBody}>
      <h3>{entry.title}</h3>
      {entry.pronunciation ? (
        <p className={styles.wordPronunciation}>{entry.pronunciation}</p>
      ) : null}
      {entry.think ? (
        <p className={styles.issueDek}>
          {entry.quizOnly ? entry.think : `Think: ${entry.think}`}
        </p>
      ) : null}
    </div>
  );

  return (
    <article className={styles.issueCard}>
      {href ? (
        <Link href={href} className={styles.issueCardLink}>
          {media}
          {body}
        </Link>
      ) : (
        <div className={styles.issueCardLink}>
          {media}
          {body}
        </div>
      )}
    </article>
  );
}
