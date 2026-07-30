"use client";

import Link from "next/link";
import { useSubscriber } from "@/context/SubscriberContext";
import { siteDisplayName } from "@/config/site";
import styles from "@/app/page.module.css";

export default function HomeAboutSection({ totalCount = 0 }) {
  const { isSubscribed } = useSubscriber();

  return (
    <section className={styles.subscribeSection}>
      <div className="container">
        <div className={styles.subscribeInner}>
          <div className={styles.subscribeCopy}>
            <h2 className={styles.subscribeHeadline}>More about {siteDisplayName}</h2>
            <p className={styles.lede}>
              {siteDisplayName} is for anyone hungry for stories about blowing up
              your life and coming out the other side changed. From moving across
              the country for a date to quitting your job to rebuilding after
              divorce to stealing from your company and going to jail, we tell
              messy, beautiful stories about people starting over.{" "}
              {isSubscribed
                ? "A new story lands in your inbox every week."
                : "A new story lands in your inbox every week when you subscribe."}
            </p>
          </div>
          <div className={styles.secondaryLinks}>
            <Link href="/archive">
              Read past articles{totalCount > 0 ? ` (${totalCount})` : ""}
            </Link>
            <span>·</span>
            <Link href="/about">About</Link>
            {!isSubscribed && (
              <>
                <span>·</span>
                <a href="/#subscribe">Subscribe</a>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
