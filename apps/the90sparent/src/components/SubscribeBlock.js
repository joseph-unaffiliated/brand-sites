import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";
import { subscribeCardDek, subscribeCardTitle } from "@/config/site";

export default function SubscribeBlock({ layout = "stack", initialEmail }) {
  const isBanner = layout === "banner";

  return (
    <div className={`${styles.root} ${isBanner ? styles.rootBanner : ""}`}>
      <div className={isBanner ? styles.bannerText : undefined}>
        <p id="subscribe-popup-title" className={styles.title}>
          {subscribeCardTitle}
        </p>
        <p className={styles.dek}>{subscribeCardDek}</p>
      </div>
      <div className={isBanner ? styles.bannerForm : undefined}>
        <SubscribeFormWithTurnstile initialEmail={initialEmail} layout={layout} />
      </div>
    </div>
  );
}
