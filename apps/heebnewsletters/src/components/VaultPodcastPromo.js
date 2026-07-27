import Link from "next/link";
import styles from "./VaultPodcastPromo.module.css";

const PODCAST_URL = "https://heebmedia.com/pages/listen";

/**
 * Static cross-promo for Heeb Media's podcast — same block in every issue
 * (not modeled in Sanity, unlike the per-issue Rabbit Hole).
 */
export default function VaultPodcastPromo() {
  return (
    <aside className={styles.promo} aria-label="Sex! Gossip! Pastrami! podcast">
      <p className={styles.eyebrow}>From Heeb Media</p>
      <h2 className={styles.title}>Sex! Gossip! Pastrami!</h2>
      <p className={styles.body}>
        The podcast picking up where the newsletter leaves off — unfiltered
        Jewish culture talk, guests, and deli-adjacent chaos.
      </p>
      <Link
        href={PODCAST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.cta}
      >
        Listen now
      </Link>
    </aside>
  );
}
