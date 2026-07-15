"use client";

import Link from "next/link";
import { useSubscriber } from "@/context/SubscriberContext";
import styles from "@/app/page.module.css";

export default function HomeAboutSection({ totalCount = 0 }) {
  const { isSubscribed } = useSubscriber();

  return (
    <section className={styles.subscribeSection}>
      <div className="container">
        <div className={styles.subscribeInner}>
          <div className={styles.subscribeCopy}>
            <h2 className={styles.subscribeHeadline}>
              More about the Dictionary of Slang
            </h2>
            <p className={styles.lede}>
              Hipspeak is the Dictionary of Slang: one word or phrase a week,
              broken down so you actually know what it means, how to use it
              (or not), and why it&apos;s everywhere right now.
              {totalCount > 0 && (
                <>
                  {" "}
                  We&apos;ve defined <strong>{totalCount} words</strong> so
                  far
                  {isSubscribed
                    ? " — with a new one in your inbox every week."
                    : " — with a new one in your inbox every week when you subscribe."}
                </>
              )}
            </p>
          </div>
          <div className={styles.secondaryLinks}>
            <Link href="/archive">
              Browse all words{totalCount > 0 ? ` (${totalCount})` : ""}
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
