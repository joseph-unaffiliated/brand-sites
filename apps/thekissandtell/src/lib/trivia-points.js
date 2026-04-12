import { BRAND } from "@/config/site";

const STORAGE_KEY = `${BRAND}_trivia_v1`;
const LEGACY_SESSION_KEY = `${BRAND}TriviaPoints`;

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * @returns {{ version: number, totalPoints: number, byQuestion: Record<string, { answered: boolean, correct?: boolean, at?: number }> }}
 */
export function readTriviaState() {
  if (typeof window === "undefined") {
    return { version: 1, totalPoints: 0, byQuestion: {} };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = safeParse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          version: 1,
          totalPoints: Number(parsed.totalPoints) || 0,
          byQuestion: typeof parsed.byQuestion === "object" && parsed.byQuestion ? parsed.byQuestion : {},
        };
      }
    }
    const legacy = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (legacy != null) {
      const n = parseInt(legacy, 10);
      if (Number.isFinite(n) && n > 0) {
        const merged = { version: 1, totalPoints: n, byQuestion: {} };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        sessionStorage.removeItem(LEGACY_SESSION_KEY);
        return merged;
      }
    }
  } catch {
    /* ignore */
  }
  return { version: 1, totalPoints: 0, byQuestion: {} };
}

function normalizeCode(code) {
  return String(code ?? "")
    .trim()
    .replace(/\)$/, "")
    .toUpperCase();
}

/**
 * @param {{ articleSlug: string, pollKey: string, selectedCode: string, correctCode: string | null | undefined, pointsPerCorrect?: number }}
 */
export function recordPollAnswer({ articleSlug, pollKey, selectedCode, correctCode, pointsPerCorrect = 1 }) {
  if (typeof window === "undefined") return readTriviaState();
  const qKey = `${articleSlug}:${pollKey}`;
  const state = readTriviaState();
  if (state.byQuestion[qKey]?.answered) return state;

  const correctNorm = correctCode ? normalizeCode(correctCode) : "";
  const selectedNorm = normalizeCode(selectedCode);
  const correct = Boolean(correctNorm && selectedNorm === correctNorm);

  const next = {
    version: 1,
    totalPoints: state.totalPoints,
    byQuestion: { ...state.byQuestion },
  };
  if (correct) {
    next.totalPoints = (next.totalPoints || 0) + pointsPerCorrect;
  }
  next.byQuestion[qKey] = { answered: true, correct, at: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
