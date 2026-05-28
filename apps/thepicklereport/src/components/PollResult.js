"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdSlot from "@/components/AdSlot";
import { executeAction, isRealBrowser } from "@/lib/subscription";
import { recordPollAnswer } from "@/lib/trivia-points";
import { submitVoteToMagic } from "@/lib/submit-vote";
import {
  formatDistributionRows,
  getOptionLabel,
  isTriviaBlock,
  normalizeChoiceCode,
  voteBlockPollKey,
} from "@/lib/vote-block";
import styles from "./PollResult.module.css";

const SLOT_MID = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID;

function DistributionBar({ row, highlight }) {
  return (
    <div className={styles.distRow}>
      <div className={styles.distLabel}>
        <span className={styles.distCode}>{row.label}</span>
        {highlight ? <span className={styles.distYou}>Your pick</span> : null}
      </div>
      <div className={styles.distTrack}>
        <div
          className={`${styles.distFill} ${highlight ? styles.distFillHighlight : ""}`}
          style={{ width: `${Math.min(100, row.percent)}%` }}
        />
      </div>
      <span className={styles.distPercent}>{row.percent > 0 ? `${row.percent}%` : "—"}</span>
    </div>
  );
}

export default function PollResult({
  issueSlug,
  choice: initialChoice,
  voteBlock,
  articleTitle,
  recommendations = [],
}) {
  const searchParams = useSearchParams();
  const [subscribeStatus, setSubscribeStatus] = useState(null);
  const [distribution, setDistribution] = useState(null);
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
    }).then((data) => {
      if (data?.distribution) setDistribution(data.distribution);
    });

    setRecorded(true);
  }, [voteBlock, issueSlug, choice, recorded, isTrivia, correctCode, email]);

  const distRows = voteBlock ? formatDistributionRows(distribution, voteBlock) : [];
  const showDistribution = distRows.some((r) => r.count > 0);
  const heading = voteBlock?.heading || (isTrivia ? "Pickle Trivia" : "Poll");
  const hasVoteContext = Boolean(voteBlock && issueSlug && choice);

  return (
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
            <p className={styles.eyebrow}>{heading}</p>
            {voteBlock.question ? (
              <p className={styles.question}>{voteBlock.question}</p>
            ) : null}

            <h1 className={styles.heading}>
              {isTrivia
                ? isCorrect
                  ? "Correct!"
                  : "Thanks for playing"
                : "Thanks for voting"}
            </h1>

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

            {isTrivia && isCorrect ? (
              <p className={styles.correctMsg}>Nice work — you nailed it.</p>
            ) : null}

            {showDistribution ? (
              <div className={styles.distribution} aria-label="Results">
                <h2 className={styles.distHeading}>How everyone voted</h2>
                {distRows.map((row) => (
                  <DistributionBar
                    key={row.code}
                    row={row}
                    highlight={row.code === choice}
                  />
                ))}
              </div>
            ) : null}

            {issueSlug && articleTitle ? (
              <p className={styles.backLinkWrap}>
                <Link href={`/article/${issueSlug}`} className={styles.backLink}>
                  Read this issue
                </Link>
              </p>
            ) : null}
          </>
        )}
      </div>

      {SLOT_MID ? (
        <div className={styles.adWrap}>
          <AdSlot slotId={SLOT_MID} format="auto" />
        </div>
      ) : null}

      {recommendations.length > 0 ? (
        <section className={styles.readMore} aria-label="More issues">
          <h2 className={styles.readMoreHeading}>More from The Pickle Report</h2>
          <ul className={styles.readMoreList}>
            {recommendations.map((article) => (
              <li key={article.slug}>
                <Link href={`/article/${article.slug}`} className={styles.readMoreItem}>
                  {article.mainImage ? (
                    <span className={styles.readMoreThumb}>
                      <Image
                        src={article.mainImage}
                        alt=""
                        width={120}
                        height={80}
                        sizes="120px"
                      />
                    </span>
                  ) : null}
                  <span className={styles.readMoreTitle}>{article.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
