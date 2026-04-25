import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <div className={styles.wrap}>
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
  );
}
