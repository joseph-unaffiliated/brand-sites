import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

const DEFAULT_COPY = {
  title: "The Dictionary of Slang",
  dek: "One word or phrase a week, decoded — what it means, how it's used, and why everyone's suddenly saying it. Delivered to your inbox.",
};

const MY_WORDS_COPY = {
  title: "Subscribe to save words",
  dek: "Create a free subscription to keep the words you want to remember in My words — and get one new word decoded in your inbox every week.",
};

export default function SubscribeBlock({
  layout = "stack",
  initialEmail,
  variant = "default",
}) {
  const isBanner = layout === "banner";
  const copy = variant === "myWords" ? MY_WORDS_COPY : DEFAULT_COPY;

  return (
    <div
      className={`${styles.root} ${isBanner ? styles.rootBanner : ""} ${variant === "myWords" ? styles.rootMyWords : ""}`}
    >
      <div className={isBanner ? styles.bannerText : undefined}>
        <p id="subscribe-popup-title" className={styles.title}>
          {copy.title}
        </p>
        <p className={styles.dek}>{copy.dek}</p>
      </div>
      <div className={isBanner ? styles.bannerForm : undefined}>
        <SubscribeFormWithTurnstile initialEmail={initialEmail} layout={layout} />
      </div>
    </div>
  );
}
