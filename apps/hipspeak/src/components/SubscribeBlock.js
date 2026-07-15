import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

export default function SubscribeBlock({ layout = "stack", initialEmail }) {
  const isBanner = layout === "banner";

  return (
    <div className={`${styles.root} ${isBanner ? styles.rootBanner : ""}`}>
      <div className={isBanner ? styles.bannerText : undefined}>
        <p id="subscribe-popup-title" className={styles.title}>
          The Dictionary of Slang
        </p>
        <p className={styles.dek}>
          One word or phrase a week, decoded — what it means, how it&apos;s
          used, and why everyone&apos;s suddenly saying it. Delivered to your
          inbox.
        </p>
      </div>
      <div className={isBanner ? styles.bannerForm : undefined}>
        <SubscribeFormWithTurnstile initialEmail={initialEmail} layout={layout} />
      </div>
    </div>
  );
}
