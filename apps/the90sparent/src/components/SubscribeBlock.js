import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";
import { subscribeCardDek, subscribeCardTitle } from "@/config/site";

export default function SubscribeBlock({
  layout = "stack",
  initialEmail,
  title = subscribeCardTitle,
  dek = subscribeCardDek,
  titleId,
}) {
  const isBanner = layout === "banner";
  const showDek = typeof dek === "string" && dek.trim().length > 0;
  const headingId = titleId ?? (isBanner ? "subscribe-popup-title" : undefined);

  return (
    <div className={`${styles.root} ${isBanner ? styles.rootBanner : ""}`}>
      <div className={isBanner ? styles.bannerText : undefined}>
        <p id={headingId} className={styles.title}>
          {title}
        </p>
        {showDek ? <p className={styles.dek}>{dek}</p> : null}
      </div>
      <div className={isBanner ? styles.bannerForm : undefined}>
        <SubscribeFormWithTurnstile initialEmail={initialEmail} layout={layout} />
      </div>
    </div>
  );
}
