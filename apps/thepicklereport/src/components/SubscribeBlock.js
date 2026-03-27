import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

export default function SubscribeBlock({ layout = "stack", initialEmail }) {
  const isBanner = layout === "banner";

  return (
    <div className={`${styles.root} ${isBanner ? styles.rootBanner : ""}`}>
      <div className={isBanner ? styles.bannerText : undefined}>
        <p id="subscribe-popup-title" className={styles.title}>
          The World&apos;s Leading Pickle News Source
        </p>
        <p className={styles.dek}>
          When the world turns to chaos, we turn to pickles. Salty, crunchy,
          dilly, and never sweet because we&apos;re not psychopaths. Weekly pickle
          coverage, delivered to your inbox.
        </p>
      </div>
      <div className={isBanner ? styles.bannerForm : undefined}>
        <SubscribeFormWithTurnstile initialEmail={initialEmail} layout={layout} />
      </div>
    </div>
  );
}
