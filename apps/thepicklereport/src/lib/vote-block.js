/**
 * Helpers for pickleVoteBlock (trivia when correctOptionCode set, else poll).
 * Option letters a–d are determined by array order (not stored in Sanity).
 */

export const OPTION_CODES = ["a", "b", "c", "d", "e", "f"];

export function normalizeChoiceCode(raw) {
  if (raw == null) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^a-f]/g, "")
    .slice(0, 1);
}

/** Letter for option at index (0 → a, 1 → b, …). */
export function optionCodeForIndex(index) {
  if (!Number.isFinite(index) || index < 0) return "";
  return OPTION_CODES[index] || "";
}

/**
 * Code for an option row: position in the list, with legacy fallback to stored `code`.
 * @param {unknown} option
 * @param {number} index
 */
export function getOptionCode(option, index) {
  const legacy = normalizeChoiceCode(option?.code);
  if (legacy) return legacy;
  return optionCodeForIndex(index);
}

/** @param {unknown} blocks */
export function findVoteBlock(blocks) {
  if (!Array.isArray(blocks)) return null;
  const vote = blocks.find((b) => b?._type === "pickleVoteBlock");
  if (vote) return vote;
  return null;
}

/** @param {unknown} block */
export function isTriviaBlock(block) {
  const code = block?.correctOptionCode;
  return typeof code === "string" && normalizeChoiceCode(code) !== "";
}

/** @param {unknown} block @param {string} choice */
export function getOptionLabel(block, choice) {
  const norm = normalizeChoiceCode(choice);
  const options = block?.options || [];
  const opt = options.find((o, i) => getOptionCode(o, i) === norm);
  return opt?.label?.trim() || norm.toUpperCase() || "";
}

/** @param {unknown} block */
export function voteBlockPollKey(block, issueSlug) {
  return block?._key || `issue:${issueSlug}`;
}

/** @param {unknown} distribution @param {unknown} block */
export function formatDistributionRows(distribution, block) {
  const counts = distribution?.counts || distribution || {};
  const total =
    typeof distribution?.total === "number"
      ? distribution.total
      : Object.values(counts).reduce((s, n) => s + (Number(n) || 0), 0);

  return (block?.options || []).map((opt, index) => {
    const code = getOptionCode(opt, index);
    const count = Number(counts[code]) || 0;
    const percent = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
    return {
      code,
      label: opt?.label || code.toUpperCase(),
      count,
      percent,
    };
  });
}

/**
 * Email / web vote URL for an issue. Uses article slug as `issue` (not a separate poll slug).
 *
 * @param {{ siteUrl: string, issueSlug: string, choiceCode: string, viaHome?: boolean }} params
 * @returns {string}
 */
export function buildPollVoteUrl({ siteUrl, issueSlug, choiceCode, viaHome = true }) {
  const base = String(siteUrl || "").replace(/\/$/, "");
  const issue = String(issueSlug || "").trim();
  const poll = normalizeChoiceCode(choiceCode);
  if (!base || !issue || !poll) return "";

  if (viaHome) {
    const url = new URL(base + "/");
    url.searchParams.set("poll", poll);
    url.searchParams.set("issue", issue);
    return url.toString();
  }

  const url = new URL(base + "/poll");
  url.searchParams.set("issue", issue);
  url.searchParams.set("choice", poll);
  return url.toString();
}

/**
 * All vote links for an issue (for email templates / Studio reference).
 * @param {{ siteUrl: string, issueSlug: string, options: unknown[] }}
 */
export function buildPollVoteUrlsForBlock({ siteUrl, issueSlug, options }) {
  return (options || []).map((opt, index) => {
    const code = getOptionCode(opt, index);
    return {
      code,
      label: opt?.label || "",
      url: buildPollVoteUrl({ siteUrl, issueSlug, choiceCode: code }),
    };
  });
}
