/**
 * Helpers for pickleVoteBlock (trivia when correctOptionCode set, else poll).
 */

const OPTION_CODES = ["a", "b", "c", "d"];

export function normalizeChoiceCode(raw) {
  if (raw == null) return "";
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^a-d]/g, "")
    .slice(0, 1);
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
  const opt = (block?.options || []).find(
    (o) => normalizeChoiceCode(o?.code) === norm,
  );
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

  return (block?.options || []).map((opt) => {
    const code = normalizeChoiceCode(opt?.code);
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

export { OPTION_CODES };
