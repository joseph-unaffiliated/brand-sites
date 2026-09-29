const DEFAULT_PRONUNCIATION = "sounds exactly how you think it does";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Card pronunciation line, or null when it's the "sounds exactly how you think" default. */
export function cardPronunciation(pronunciation) {
  const text = String(pronunciation || "").trim();
  if (!text || normalize(text) === DEFAULT_PRONUNCIATION) return null;
  return text;
}
