"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ArticleStickyBottom from "@/components/ArticleStickyBottom";
import { siteDisplayName } from "@/config/site";
import { executeAction, isRealBrowser } from "@/lib/subscription";
import { recordPollAnswer } from "@/lib/trivia-points";
import { submitVoteToMagic } from "@/lib/submit-vote";
import { track, flush } from "@publication-websites/reader-events";
import {
  getOptionCode,
  getOptionLabel,
  isTriviaBlock,
  normalizeChoiceCode,
  voteBlockPollKey,
} from "@/lib/vote-block";
import articleStyles from "@/app/word/[slug]/page.module.css";
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
    if (issueSlug) {
      track("poll_view", { articleSlug: issueSlug, issueSlug });
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
      track("trivia_answer", {
        articleSlug: issueSlug,
        issueSlug,
        blockKey: pollKey,
        selectedCode: choice,
        correct: isCorrect,
      });
    } else {
      track("poll_vote", {
        articleSlug: issueSlug,
        issueSlug,
        blockKey: pollKey,
        selectedCode: choice,
      });
    }
    flush(true);

    submitVoteToMagic({
      issueSlug,
      blockKey: pollKey,
      selectedCode: choice,
      correctOptionCode: isTrivia ? correctCode : null,
    });

    setRecorded(true);
  }, [voteBlock, issueSlug, choice, recorded, isTrivia, correctCode, isCorrect]);

  const hasVoteContext = Boolean(voteBlock && issueSlug && choice);
  const fallbackHeading = isTrivia ? "Trivia" : "Poll";

  return (
    <div className={styles.pollPage}>
      <div className={styles.page}>
        <div className={styles.resultCard}>
        {isSubscribed && (
          <p className={styles.thanks}>
            {subscribeStatus === "success"
              ? `You're now subscribed to ${siteDisplayName} — thanks for playing!`
              : subscribeStatus === "error"
                ? "We had trouble confirming your subscription, but your answer was counted."
                : "Thanks for subscribing and playing!"}
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

            {isTrivia && correctLabel ? (
              <>
                <p className={isCorrect ? styles.verdictRight : styles.verdictWrong}>
                  {isCorrect ? "You got it!" : "Not quite."}
                </p>
                <ul className={styles.options}>
                  {(voteBlock.options || []).map((opt, index) => {
                    const code = getOptionCode(opt, index);
                    const isAnswer = code === correctCode;
                    const isPick = code === choice;
                    const rowClass = [
                      styles.option,
                      isAnswer ? styles.optionAnswer : "",
                      isPick && !isAnswer ? styles.optionWrongPick : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <li key={opt._key ?? code} className={rowClass}>
                        <span className={styles.optionLabel}>{opt.label}</span>
                        {isAnswer || isPick ? (
                          <span className={styles.optionTags}>
                            {isAnswer ? (
                              <span className={styles.tagAnswer}>Correct answer</span>
                            ) : null}
                            {isPick ? <span className={styles.tagPick}>Your answer</span> : null}
                          </span>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : selectedLabel ? (
              <p className={styles.yourPick}>
                Your answer: <strong>{selectedLabel}</strong>
              </p>
            ) : null}
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
                  href={`/word/${article.slug}`}
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
                  {article.think ? (
                    <p className={articleStyles.readMoreDek}>{article.think}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <ArticleStickyBottom />
    </div>
  );
}
