"use client";

import { useCallback, useEffect, useState } from "react";
import { recordPollAnswer, readTriviaState } from "@/lib/trivia-points";
import styles from "./ArticleContentBlocks.module.css";

export default function PollBlockClient({ block, articleSlug }) {
  const pollKey = block._key || "poll";
  const correctCode = block.correctCode ? String(block.correctCode).trim() : "";

  const [revealed, setRevealed] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [points, setPoints] = useState(0);

  const options = block.options || [];

  useEffect(() => {
    const st = readTriviaState();
    setPoints(st.totalPoints);
    const qk = `${articleSlug}:${pollKey}`;
    if (st.byQuestion[qk]?.answered) {
      setRevealed(true);
    }
  }, [articleSlug, pollKey]);

  const handlePick = useCallback(
    (letter) => {
      if (revealed) return;
      setSelectedLetter(letter);
      setRevealed(true);
      const next = recordPollAnswer({
        articleSlug,
        pollKey,
        selectedCode: letter,
        correctCode: correctCode || null,
      });
      setPoints(next.totalPoints);
    },
    [articleSlug, pollKey, correctCode, revealed],
  );

  return (
    <aside className={styles.poll}>
      {block.heading ? <p className={styles.eyebrow}>{block.heading}</p> : null}
      {block.question ? <h2 className={styles.blockHeading}>{block.question}</h2> : null}
      <ul className={styles.pollOptionList}>
        {options.map((opt, i) => {
          const letter =
            (opt.code && String(opt.code).trim()) || String.fromCharCode(65 + i);
          const L = letter.replace(/\)$/, "");
          const isSelected = revealed && selectedLetter === L;
          const isCorrect =
            revealed && correctCode && normalize(L) === normalize(correctCode);
          const isWrongPick = revealed && isSelected && correctCode && !isCorrect;
          return (
            <li key={opt._key || `${L}-${i}`}>
              <button
                type="button"
                className={`${styles.pollOptionRow} ${styles.pollOptionButton}`}
                onClick={() => handlePick(L)}
                disabled={revealed}
                aria-pressed={isSelected}
              >
                <span className={styles.pollLetter} aria-hidden>
                  {L}
                </span>
                <span className={styles.pollOptionText}>{opt.text}</span>
                {revealed && isCorrect ? (
                  <span className={styles.pollMark} aria-hidden>
                    {" "}
                    ✓
                  </span>
                ) : null}
                {isWrongPick ? (
                  <span className={styles.pollMark} aria-hidden>
                    {" "}
                    ✗
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      {block.answerTeaser ? <p className={styles.pollTeaser}>{block.answerTeaser}</p> : null}
      {revealed && correctCode ? (
        <p className={styles.pollReveal}>
          Correct answer: <strong>{correctCode.replace(/\)$/, "")}</strong>
        </p>
      ) : null}
      <p className={styles.pollPoints} aria-live="polite">
        Pickle trivia points: <strong>{points}</strong>
      </p>
      {block.lastWeekQuestion ? <p className={styles.pollLastQ}>{block.lastWeekQuestion}</p> : null}
      {(block.lastWeekResults || []).length > 0 ? (
        <ul className={styles.pollResults}>
          {(block.lastWeekResults || []).map((r) => (
            <li key={r._key || r.label}>
              {r.isCorrect ? "✅" : "❌"} {Number.isFinite(r.percent) ? `${r.percent}%` : ""} — {r.label}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function normalize(code) {
  return String(code ?? "")
    .trim()
    .replace(/\)$/, "")
    .toUpperCase();
}
