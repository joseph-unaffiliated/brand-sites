"use client";

import { useSubscriber } from "@/context/SubscriberContext";
import SubscribeFormWithTurnstile from "@/components/SubscribeFormWithTurnstile";
import styles from "@/app/page.module.css";

const CTA_TITLE = "Subscribe now and get a new recipe every week";

/**
 * Spacious, About-style subscribe band (homepage bottom + recipes listing).
 */
export default function HomeSubscribeSection({
  initialEmail,
  inputId = "home-subscribe-cta-email",
  titleId = "home-subscribe-cta-title",
}) {
  const { isSubscribed } = useSubscriber();
  if (isSubscribed) {
    return <div className={styles.subscribeCtaSpacer} aria-hidden="true" />;
  }

  return (
    <section className={styles.subscribeCtaSection} aria-labelledby={titleId}>
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
