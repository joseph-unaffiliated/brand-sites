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
              More about The Eyeballer&apos;s Cookbook
            </h2>
            <p className={styles.lede}>
              <em>The Eyeballer&apos;s Cookbook</em> is for people who cook by
              feel. No measuring cups, no gram scales — just simple recipes
              built on a handful of ingredients, a few glugs and pinches, and
              the confidence to eyeball it.
              {totalCount > 0 && (
                <>
                  {" "}
                  We&apos;ve shared <strong>{totalCount} recipes</strong> so
                  far
                  {isSubscribed
                    ? " — with a new one in your inbox every week."
                    : " — with a new one in your inbox every week when you subscribe."}
                </>
              )}
            </p>
          </div>
          <div className={styles.secondaryLinks}>
            <Link href="/recipes">
              Browse all recipes{totalCount > 0 ? ` (${totalCount})` : ""}
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
