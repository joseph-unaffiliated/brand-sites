import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

export default function SubscribeBlock({ layout = "stack", initialEmail }) {
  const isBanner = layout === "banner";

  return (
    <div className={`${styles.root} ${isBanner ? styles.rootBanner : ""}`}>
      <div className={isBanner ? styles.bannerText : undefined}>
        <p id="subscribe-popup-title" className={styles.title}>
          Hookup stories, in all their shame and glory
        </p>
        <p className={styles.dek}>
          Each week, one person takes us through some of the wildest moments
          along their journey of exploring their relationship to sex and
          connection – delivered straight to your inbox.
        </p>
      </div>
      <div className={isBanner ? styles.bannerForm : undefined}>
        <SubscribeFormWithTurnstile initialEmail={initialEmail} layout={layout} />
      </div>
    </div>
  );
}
