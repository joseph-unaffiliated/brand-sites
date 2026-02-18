import styles from "../basic-page.module.css";

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1>Privacy</h1>
        <p>
          We respect your privacy and use data only to deliver the Hookup Lists
          experience. Full privacy details will be published here.
        </p>
        <p className={styles.note}>
          Placeholder page — privacy policy coming soon.
        </p>
      </div>
    </div>
  );
}
