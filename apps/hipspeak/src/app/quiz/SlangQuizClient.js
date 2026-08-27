"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSubscriber } from "@/context/SubscriberContext";
import MyWordButton from "@/components/MyWordButton";
import SubscribeFormWithTurnstile from "@/components/SubscribeFormWithTurnstile";
import { BRAND, executeAction } from "@/lib/subscription";
import {
  clearQuizProgress,
  loadQuizProgress,
  saveQuizProgress,
  scoreCommentary,
  scoreQuiz,
  slangQuiz,
} from "@/data/slangQuiz";
import styles from "./quiz.module.css";

function fireEvent(name, params = {}) {
  if (typeof gtag !== "undefined") {
    gtag("event", name, { event_category: "quiz", ...params });
  }
}

export default function SlangQuizClient() {
  const searchParams = useSearchParams();
  const { isSubscribed, refresh } = useSubscriber();
  const startedRef = useRef(false);

  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("intro"); // intro | questions | gate | results
  const [hydrated, setHydrated] = useState(false);

  const questions = slangQuiz.questions;
  const current = questions[index];
  const allAnswered = questions.every((q) => answers[q.id]);

  const score = useMemo(() => scoreQuiz(answers), [answers]);

  useEffect(() => {
    const saved = loadQuizProgress();
    const justSubscribed = searchParams.get("subscribed") === "true";
    if (saved?.answers && Object.keys(saved.answers).length) {
      setAnswers(saved.answers);
      if (saved.phase === "results" || justSubscribed || isSubscribed) {
        if (Object.keys(saved.answers).length >= questions.length) {
          setPhase("results");
        } else {
          setPhase(saved.phase || "questions");
          setIndex(typeof saved.index === "number" ? saved.index : 0);
        }
      } else if (saved.phase === "gate") {
        setPhase("gate");
      } else {
        setPhase(saved.phase || "intro");
        setIndex(typeof saved.index === "number" ? saved.index : 0);
      }
    } else if (justSubscribed) {
      setPhase("intro");
    }
    setHydrated(true);
  }, [isSubscribed, questions.length, searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    if (phase === "intro") return;
    saveQuizProgress({ answers, index, phase, quizId: slangQuiz.id });
  }, [answers, hydrated, index, phase]);

  function startQuiz() {
    setPhase("questions");
    setIndex(0);
    setAnswers({});
    if (!startedRef.current) {
      startedRef.current = true;
      fireEvent("quiz_start", { quiz_id: slangQuiz.id });
    }
  }

  function pickOption(optionId) {
    if (!current || answers[current.id]) return;
    const nextAnswers = { ...answers, [current.id]: optionId };
    setAnswers(nextAnswers);
    const isLast = index >= questions.length - 1;
    window.setTimeout(() => {
      if (!isLast) {
        setIndex((i) => i + 1);
        return;
      }
      fireEvent("quiz_complete", {
        quiz_id: slangQuiz.id,
        score: scoreQuiz(nextAnswers).correct,
      });
      if (isSubscribed) {
        setPhase("results");
        fireEvent("quiz_results_reveal", { quiz_id: slangQuiz.id });
      } else {
        setPhase("gate");
        fireEvent("quiz_subscribe_gate", { quiz_id: slangQuiz.id });
      }
    }, 220);
  }

  useEffect(() => {
    if (!hydrated || phase !== "gate") return;
    if (isSubscribed && allAnswered) {
      setPhase("results");
      fireEvent("quiz_results_reveal", { quiz_id: slangQuiz.id, via: "subscribe" });
    }
  }, [allAnswered, hydrated, isSubscribed, phase]);

  if (!hydrated) {
    return <div className={styles.wrap}><p className={styles.muted}>Loading…</p></div>;
  }

  if (phase === "intro") {
    return (
      <div className={styles.wrap}>
        <header className={styles.header}>
          <p className={styles.kicker}>Hipspeak quiz</p>
          <h1 className={styles.title}>{slangQuiz.title}</h1>
          <p className={styles.dek}>{slangQuiz.dek}</p>
        </header>
        <button type="button" className={styles.primaryBtn} onClick={startQuiz}>
          Start quiz
        </button>
      </div>
    );
  }

  if (phase === "gate") {
    return (
      <div className={styles.wrap}>
        <header className={styles.header}>
          <h1 className={styles.title}>Unlock your score</h1>
          <p className={styles.dek}>
            You finished all {questions.length} questions. Subscribe to Hipspeak
            to see how you did — and get one new word decoded every week.
          </p>
        </header>
        <div className={styles.gateCard}>
          <SubscribeFormWithTurnstile
            layout="stack"
            utmCampaign="slang_quiz"
            onStaySubmit={async (email) => {
              const params = new URLSearchParams();
              params.set("email", email);
              params.set("utm_source", BRAND);
              params.set("utm_campaign", "slang_quiz");
              try {
                await executeAction(params, "subscribe");
              } catch {
                /* still reveal — existing readers shouldn't be stranded */
              }
              localStorage.setItem(`subscribed_${BRAND}`, "true");
              localStorage.setItem(`email_${BRAND}`, encodeURIComponent(email));
              if (!localStorage.getItem(`subscribed_at_${BRAND}`)) {
                localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
              }
              window.dispatchEvent(new Event("magic-subscriber-updated"));
              refresh();
              setPhase("results");
              fireEvent("quiz_results_reveal", {
                quiz_id: slangQuiz.id,
                via: "email_gate",
              });
            }}
          />
        </div>
        <p className={styles.muted}>
          Already subscribed? Enter that same email above to see your score
          here — no need to leave this page.
        </p>
      </div>
    );
  }

  if (phase === "results") {
    const commentary = scoreCommentary(score.correct, score.total);
    const detailById = Object.fromEntries(
      score.detail.map((d) => [d.questionId, d])
    );
    return (
      <div className={`${styles.wrap} ${styles.wrapResults}`}>
        <header className={styles.header}>
          <p className={styles.kicker}>Your results</p>
          <h1 className={styles.title}>
            {score.correct} / {score.total}
          </h1>
          <p className={styles.dek}>{commentary}</p>
        </header>
        <ol className={styles.review}>
          {questions.map((q) => {
            const detail = detailById[q.id];
            const correct = q.options.find((o) => o.id === q.correctOptionId);
            const picked = q.options.find((o) => o.id === detail?.picked);
            const wrong = detail && !detail.isCorrect;
            return (
              <li
                key={q.id}
                className={wrong ? styles.reviewItemWrong : styles.reviewItem}
              >
                <div className={styles.reviewTop}>
                  <p className={styles.reviewBody}>
                    {q.prompt}{" "}
                    <strong className={wrong ? styles.reviewCorrect : undefined}>
                      {correct?.label}
                    </strong>
                  </p>
                  {q.wordSlug ? (
                    <MyWordButton slug={q.wordSlug} variant="card" />
                  ) : null}
                </div>
                {wrong && picked ? (
                  <p className={styles.reviewMissed}>You said: {picked.label}</p>
                ) : null}
              </li>
            );
          })}
        </ol>
        <div className={styles.ctaRow}>
          <Link href="/archive" className={styles.primaryBtn}>
            Browse the dictionary
          </Link>
          <Link href="/" className={styles.secondaryBtn}>
            Latest word
          </Link>
        </div>
        <button
          type="button"
          className={styles.textBtn}
          onClick={() => {
            clearQuizProgress();
            setAnswers({});
            setIndex(0);
            setPhase("intro");
          }}
        >
          Retake quiz
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.progress}>
        Question {index + 1} of {questions.length}
      </div>
      <h1 className={styles.question}>{current.prompt}</h1>
      <ul className={styles.options}>
        {current.options.map((opt) => {
          const selected = answers[current.id] === opt.id;
          return (
            <li key={opt.id}>
              <button
                type="button"
                className={selected ? styles.optionSelected : styles.option}
                onClick={() => pickOption(opt.id)}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
