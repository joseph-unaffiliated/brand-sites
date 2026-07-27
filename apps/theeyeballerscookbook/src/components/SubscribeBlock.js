import styles from "./SubscribeBlock.module.css";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

const DEFAULT_COPY = {
  title: "Recipes Without Measurements",
  dek: "A pinch of this, a few glugs of that. One simple recipe a week you can cook by feel — no measuring cups, no gram scales, no stress. Delivered to your inbox.",
};

const FAVORITES_COPY = {
  title: "Subscribe to save favorites",
  dek: "Create a free subscription to keep the recipes you love — and get one new eyeballer recipe in your inbox every week.",
};

export default function SubscribeBlock({
  layout = "stack",
  initialEmail,
  variant = "default",
}) {
  const isBanner = layout === "banner";
  const copy = variant === "favorites" ? FAVORITES_COPY : DEFAULT_COPY;

  return (
    <div
      className={`${styles.root} ${isBanner ? styles.rootBanner : ""} ${variant === "favorites" ? styles.rootFavorites : ""}`}
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
