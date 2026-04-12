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
              <em>{siteDisplayName}</em> is for anyone navigating dating today—situationships, soft
              launches, hard conversations, and the occasional triumph. Each issue brings honest
              stories, smart context, and the kind of detail you actually want to read.
              {totalCount > 0 && (
                <>
                  {" "}
                  We&apos;ve published <strong>{totalCount} issues</strong> so far
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
