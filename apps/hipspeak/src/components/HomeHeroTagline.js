"use client";

import { useSubscriber } from "@/context/SubscriberContext";
import { siteHeroTagline } from "@/config/site";
import styles from "@/app/page.module.css";

export default function HomeHeroTagline() {
  const { isSubscribed } = useSubscriber();
  return (
    <p
      className={`${styles.heroTagline}${isSubscribed ? ` ${styles.heroTaglineSubscribed}` : ""}`}
    >
      {siteHeroTagline}
    </p>
  );
}
