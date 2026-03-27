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
              More about The Pickle Report
            </h2>
            <p className={styles.lede}>
              <em>The Pickle Report</em> tracks the stories, trends, and oddities
              that keep pickle culture thriving. From regional rivalries and
              brine debates to pickle festivals and pantry staples, each issue
              delivers a sharp, fun look at the pickle world.
              {totalCount > 0 && (
                <>
                  {" "}
                  We&apos;ve published <strong>{totalCount} issues</strong> so
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
              Read past issues{totalCount > 0 ? ` (${totalCount})` : ""}
            </Link>
            <span>·</span>
            <Link href="/about">Learn about the project</Link>
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
