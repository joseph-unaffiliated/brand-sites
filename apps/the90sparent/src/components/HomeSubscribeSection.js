"use client";

import { useSubscriber } from "@/context/SubscriberContext";
import SubscribeFormWithTurnstile from "@/components/SubscribeFormWithTurnstile";
import styles from "@/app/page.module.css";

const CTA_TITLE = "Subscribe now and get a new issue every Tuesday";

/**
 * Spacious, About-style subscribe band (homepage bottom + archive).
 */
export default function HomeSubscribeSection({
  initialEmail,
  inputId = "home-subscribe-cta-email",
  titleId = "home-subscribe-cta-title",
  /** When true (no second mosaic above), use accent bg + black subscribe button. */
  accentBand = false,
}) {
  const { isSubscribed } = useSubscriber();
  if (isSubscribed) {
    return <div className={styles.subscribeCtaSpacer} aria-hidden="true" />;
  }

  return (
    <section
      className={`${styles.subscribeCtaSection}${accentBand ? ` ${styles.subscribeCtaSectionAccent}` : ""}`}
      aria-labelledby={titleId}
    >
      <div className="container">
        <div className={styles.subscribeCtaInner}>
          <h2 id={titleId} className={styles.subscribeCtaHeadline}>
            {CTA_TITLE}
          </h2>
          <div className={styles.subscribeCtaForm}>
            <SubscribeFormWithTurnstile
              initialEmail={initialEmail}
              layout="cta"
              inputId={inputId}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
