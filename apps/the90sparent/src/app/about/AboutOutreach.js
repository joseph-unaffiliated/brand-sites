"use client";

import ContactCopyLink from "@/components/ContactCopyLink";
import SubmissionsCopyLink from "@/components/SubmissionsCopyLink";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
import { useSubscriber } from "@/context/SubscriberContext";
import { siteConfig } from "@/config/site";
import styles from "./page.module.css";

const titleBtn = `${styles.outreachButton} ${styles.outreachTitleButton}`;

export default function AboutOutreach() {
  const { isSubscribed, email } = useSubscriber();
  const base = siteConfig.magicSubscribeBase.replace(/\/?$/, "");
  const canManage = Boolean(isSubscribed && email);
  const encoded = email ? encodeURIComponent(email) : "";

  return (
    <div className={styles.outreach}>
      <div className={styles.outreachItem}>
        <ContactCopyLink className={titleBtn}>Contact</ContactCopyLink>
        <p className={styles.outreachDek}>
          For general inquiries, requests, or suggestions from readers or prospective partners.
        </p>
      </div>
      <div className={styles.outreachItem}>
        <SubmissionsCopyLink className={titleBtn}>Submissions</SubmissionsCopyLink>
        <p className={styles.outreachDek}>
          We accept article submissions, 400–600 words. Paid. Send a short pitch via email.
        </p>
      </div>
      <div className={styles.outreachItem}>
        <AdvertiseCopyLink className={titleBtn} />
        <p className={styles.outreachDek}>
          We run ads in our email and on our site. Ask us about formats, availability, and rates.
        </p>
      </div>
      {canManage ? (
        <div className={styles.subscriberRow}>
          <a
            className={styles.subscriberLink}
            href={`${base}/unsubscribe?email=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Unsubscribe
          </a>
          <a
            className={styles.subscriberLink}
            href={`${base}/snooze?email=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Snooze
          </a>
        </div>
      ) : null}
    </div>
  );
}
