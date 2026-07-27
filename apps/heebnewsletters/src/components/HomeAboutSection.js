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
              More about From the Vault
            </h2>
            <p className={styles.lede}>
              <em>From the Vault, by Heeb</em> digs up the 2000s&apos; weirdest,
              most subversive Jewish counter-culture media — old Heeb pages,
              lost zines, and internet ephemera — and delivers it back to your
              inbox with the context and commentary it deserves.
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
