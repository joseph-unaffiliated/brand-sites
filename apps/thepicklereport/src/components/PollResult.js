"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ArticleAdStickyBottom from "@/components/ArticleAdStickyBottom";
import { executeAction, isRealBrowser } from "@/lib/subscription";
import { recordPollAnswer } from "@/lib/trivia-points";
import { submitVoteToMagic } from "@/lib/submit-vote";
import {
  getOptionLabel,
  isTriviaBlock,
  normalizeChoiceCode,
  voteBlockPollKey,
} from "@/lib/vote-block";
import articleStyles from "@/app/article/[slug]/page.module.css";
import styles from "./PollResult.module.css";

export default function PollResult({
  issueSlug,
  choice: initialChoice,
  voteBlock,
  recommendations = [],
}) {
  const searchParams = useSearchParams();
  const [subscribeStatus, setSubscribeStatus] = useState(null);
  const [recorded, setRecorded] = useState(false);

  const choice =
    normalizeChoiceCode(initialChoice) ||
    normalizeChoiceCode(searchParams.get("choice")) ||
    normalizeChoiceCode(searchParams.get("poll"));

  const email = searchParams.get("email");
  const isSubscribed = searchParams.get("subscribed") === "true";
  const isTrivia = voteBlock ? isTriviaBlock(voteBlock) : false;
  const correctCode =
    isTrivia && voteBlock ? normalizeChoiceCode(voteBlock.correctOptionCode) : "";
  const selectedLabel = voteBlock && choice ? getOptionLabel(voteBlock, choice) : "";
  const correctLabel =
    voteBlock && correctCode ? getOptionLabel(voteBlock, correctCode) : "";
  const isCorrect = isTrivia && choice && choice === correctCode;

  const recs = recommendations.slice(0, 3);

  useEffect(() => {
    if (typeof gtag !== "undefined") {
      gtag("event", "poll_view", {
        event_category: "engagement",
        event_label: issueSlug || "unknown_issue",
      });
    }
  }, [issueSlug]);

  useEffect(() => {
    if (isSubscribed && email && isRealBrowser()) {
      executeAction(searchParams, "subscribe")
        .then((data) => setSubscribeStatus(data.success ? "success" : "error"))
        .catch(() => setSubscribeStatus("error"));
    }
  }, [searchParams, isSubscribed, email]);

  useEffect(() => {
    if (!voteBlock || !issueSlug || !choice || recorded) return;

    const pollKey = voteBlockPollKey(voteBlock, issueSlug);

    if (isTrivia) {
      recordPollAnswer({
        articleSlug: issueSlug,
        pollKey,
        selectedCode: choice,
        correctCode,
      });
    }

    submitVoteToMagic({
      issueSlug,
      blockKey: pollKey,
      selectedCode: choice,
      email: email ? decodeURIComponent(email) : null,
    });

    setRecorded(true);
  }, [voteBlock, issueSlug, choice, recorded, isTrivia, correctCode, email]);

  const hasVoteContext = Boolean(voteBlock && issueSlug && choice);
  const fallbackHeading = isTrivia ? "Pickle Trivia" : "Poll";

  return (
    <div className={styles.pollPage}>
      <div className={styles.page}>
        <div className={styles.resultCard}>
        {isSubscribed && (
          <p className={styles.thanks}>
            {subscribeStatus === "success"
              ? "You're now subscribed to The Pickle Report — thanks for voting!"
              : subscribeStatus === "error"
                ? "We had trouble confirming your subscription, but your vote was counted."
                : "Thanks for subscribing and voting!"}
          </p>
        )}

        {!hasVoteContext ? (
          <>
            <h1 className={styles.heading}>You&apos;re all set.</h1>
            <p className={styles.lead}>
              Thanks for participating. We&apos;ll be in touch when we have more for you.
            </p>
          </>
        ) : (
          <>
            <h1 className={styles.heading}>
              {voteBlock.question?.trim() || fallbackHeading}
            </h1>

            {isTrivia && isCorrect && correctLabel ? (
              <p className={styles.correctMsg}>
                You&apos;re right! The answer was &apos;{correctLabel}&apos;
              </p>
            ) : (
              <>
                {selectedLabel ? (
                  <p className={styles.yourPick}>
                    Your answer: <strong>{selectedLabel}</strong>
                  </p>
                ) : null}

                {isTrivia && !isCorrect && correctLabel ? (
                  <p className={styles.correctAnswer}>
                    The correct answer was: <strong>{correctLabel}</strong>
                  </p>
                ) : null}
              </>
            )}
          </>
        )}
        </div>
      </div>

      {recs.length > 0 ? (
        <div className={articleStyles.readMoreOuter}>
          <section className={articleStyles.readMore} aria-label="Suggested issues">
            <div className={articleStyles.readMoreGrid}>
              {recs.map((article) => (
                <Link
                  key={article._id ?? article.slug}
                  href={`/article/${article.slug}`}
                  className={articleStyles.readMoreCard}
                >
                  <div className={articleStyles.readMoreThumb}>
                    <Image
                      src={article.mainImage}
                      alt=""
                      width={280}
                      height={187}
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                  </div>
                  <h3 className={articleStyles.readMoreHeadline}>{article.title}</h3>
                  {article.summary ? (
                    <p className={articleStyles.readMoreDek}>{article.summary}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <ArticleAdStickyBottom />
    </div>
  );
}
