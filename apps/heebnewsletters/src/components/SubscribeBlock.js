import { subscribeCardDek, subscribeCardTitle } from "@/config/site";
import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

/** Keep hyphenated words (e.g. "counter-culture") from breaking at the hyphen. */
function keepHyphenatedTogether(text) {
  return text.split(/(\p{L}+(?:-\p{L}+)+)/u).map((part, index) =>
    index % 2 ? (
      <span key={index} className={styles.nowrap}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

export default function SubscribeBlock({ layout = "stack", initialEmail }) {
  const isBanner = layout === "banner";

  return (
    <div className={`${styles.root} ${isBanner ? styles.rootBanner : ""}`}>
      <div className={isBanner ? styles.bannerText : undefined}>
        <p id="subscribe-popup-title" className={styles.title}>
          {subscribeCardTitle}
        </p>
        <p className={styles.dek}>{keepHyphenatedTogether(subscribeCardDek)}</p>
      </div>
      <div className={isBanner ? styles.bannerForm : undefined}>
        <SubscribeFormWithTurnstile initialEmail={initialEmail} layout={layout} />
      </div>
    </div>
  );
}
