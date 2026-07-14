"use client";

import { useSearchParams } from "next/navigation";
import { ContactCopyLink } from "@publication-websites/web-shell/contact-copy";
import SubmissionsCopyLink from "@/components/SubmissionsCopyLink";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
import { contactEmail, siteConfig } from "@/config/site";
import styles from "./page.module.css";

const titleBtn = `${styles.outreachButton} ${styles.outreachTitleButton}`;

export default function AboutOutreach() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email")?.trim() ?? "";
  const base = siteConfig.magicSubscribeBase.replace(/\/?$/, "");
  const showSubscriberRow = Boolean(emailFromUrl);
  const encoded = encodeURIComponent(emailFromUrl);

  return (
    <div className={styles.outreach}>
      <div className={styles.outreachItem}>
        <ContactCopyLink email={contactEmail} className={titleBtn}>
          Contact
        </ContactCopyLink>
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
      {showSubscriberRow ? (
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
            Snooze for 3 Months
          </a>
        </div>
      ) : null}
    </div>
  );
}
