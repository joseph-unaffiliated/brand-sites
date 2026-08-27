/**
 * Hardcoded Gen Z / Alpha slang quiz (v1). Sanity later if needed.
 * Each option: { id, label }. correctOptionId scores 1 point.
 */

export const QUIZ_STORAGE_KEY = "hipspeak_slang_quiz_v1";

export const slangQuiz = {
  id: "slang-knowledge-v1",
  title: "How fluent is your slang?",
  dek: "Ten questions. No judgment (okay, a little judgment). Subscribe to unlock your score.",
  questions: [
    {
      id: "q1",
      term: "Hard",
      wordSlug: "hard",
      prompt: "Someone says a fit is “hard.” They mean…",
      options: [
        { id: "a", label: "It’s difficult to put on" },
        { id: "b", label: "It looks really good" },
        { id: "c", label: "It’s outdated" },
        { id: "d", label: "It’s only for winter" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q2",
      term: "It’s giving",
      wordSlug: "its-giving",
      prompt: "“It’s giving…” usually introduces…",
      options: [
        { id: "a", label: "A gift recommendation" },
        { id: "b", label: "A vibe or aesthetic comparison" },
        { id: "c", label: "A cooking tip" },
        { id: "d", label: "A sports score" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q3",
      term: "Mid",
      wordSlug: "mid",
      prompt: "If something is “mid,” it’s…",
      options: [
        { id: "a", label: "Average / mediocre" },
        { id: "b", label: "Extremely rare" },
        { id: "c", label: "From the Midwest" },
        { id: "d", label: "Only available at noon" },
      ],
      correctOptionId: "a",
    },
    {
      id: "q4",
      term: "Rizz",
      wordSlug: "rizz",
      prompt: "“Rizz” is closest to…",
      options: [
        { id: "a", label: "Charisma / flirting skill" },
        { id: "b", label: "A type of pasta" },
        { id: "c", label: "Anger" },
        { id: "d", label: "A video filter" },
      ],
      correctOptionId: "a",
    },
    {
      id: "q5",
      term: "Sus",
      wordSlug: "sus",
      prompt: "Calling someone “sus” means they’re…",
      options: [
        { id: "a", label: "Suspicious" },
        { id: "b", label: "Sustainable" },
        { id: "c", label: "Super intelligent" },
        { id: "d", label: "From Sussex" },
      ],
      correctOptionId: "a",
    },
    {
      id: "q6",
      term: "No cap",
      wordSlug: "no-cap",
      prompt: "“No cap” means…",
      options: [
        { id: "a", label: "I’m not wearing a hat" },
        { id: "b", label: "No lie / for real" },
        { id: "c", label: "Stop spending" },
        { id: "d", label: "End of story" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q7",
      term: "Ate",
      wordSlug: "ate",
      prompt: "If a look is “ate,” it…",
      options: [
        { id: "a", label: "Needs food" },
        { id: "b", label: "Slayed / was excellent" },
        { id: "c", label: "Got deleted" },
        { id: "d", label: "Is unfinished" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q8",
      term: "Bet",
      wordSlug: "bet",
      prompt: "“Bet” as a reply most often means…",
      options: [
        { id: "a", label: "I disagree" },
        { id: "b", label: "Okay / sounds good" },
        { id: "c", label: "Place a wager" },
        { id: "d", label: "I’m confused" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q9",
      term: "Slaps",
      wordSlug: "slaps",
      prompt: "Something “slaps” when it…",
      options: [
        { id: "a", label: "Is aggressively bad" },
        { id: "b", label: "Is excellent (music, food, etc.)" },
        { id: "c", label: "Requires physical contact" },
        { id: "d", label: "Is too loud" },
      ],
      correctOptionId: "b",
    },
    {
      id: "q10",
      term: "Touch grass",
      wordSlug: "touch-grass",
      prompt: "“Touch grass” is advice to…",
      options: [
        { id: "a", label: "Mow the lawn" },
        { id: "b", label: "Go offline / get some real-world perspective" },
        { id: "c", label: "Start gardening" },
        { id: "d", label: "Buy new sneakers" },
      ],
      correctOptionId: "b",
    },
  ],
};

/** Titles for quiz terms saved to My words that may not have a dictionary page yet. */
export const quizWordTitles = Object.fromEntries(
  slangQuiz.questions
    .filter((q) => q.wordSlug)
    .map((q) => [q.wordSlug, q.term])
);

/** Richer quiz-term meta for My words cards when no Sanity entry exists yet. */
export const quizWordMeta = Object.fromEntries(
  slangQuiz.questions
    .filter((q) => q.wordSlug)
    .map((q) => {
      const answer = q.options.find((o) => o.id === q.correctOptionId);
      return [
        q.wordSlug,
        {
          title: q.term,
          think: answer?.label ?? null,
        },
      ];
    })
);

/** @param {Record<string, string>} answers questionId → optionId */
export function scoreQuiz(answers) {
  let correct = 0;
  const detail = slangQuiz.questions.map((q) => {
    const picked = answers?.[q.id] ?? null;
    const isCorrect = picked === q.correctOptionId;
    if (isCorrect) correct += 1;
    return { questionId: q.id, picked, correctOptionId: q.correctOptionId, isCorrect };
  });
  return {
    correct,
    total: slangQuiz.questions.length,
    detail,
  };
}

/** Short commentary by score band. */
export function scoreCommentary(correct, total) {
  const pct = total ? correct / total : 0;
  if (pct >= 0.9) {
    return "Fluent. You’re either Gen Z or you’ve been taking notes.";
  }
  if (pct >= 0.7) {
    return "Solid. You’d survive the group chat without asking too many questions.";
  }
  if (pct >= 0.4) {
    return "Getting there. Read a few more Hipspeak entries and you’ll cook.";
  }
  return "Respectfully? Touch grass, then come back for next week’s word.";
}

export function saveQuizProgress(payload) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function loadQuizProgress() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(QUIZ_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearQuizProgress() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
