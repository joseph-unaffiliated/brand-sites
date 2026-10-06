/**
 * Shopify product handles for Heeb print back issues currently in the shop.
 * Magazine numbers are not always `heeb-N` (e.g. #3 is `heeb-3-superjew`).
 * Used when a vault article's `originalIssueUrl` is missing or is not a
 * product URL, so any story from a for-sale issue still gets a shop card.
 */
export const BACK_ISSUE_HANDLES = {
  2: "heeb-2",
  3: "heeb-3-superjew",
  4: "heeb-4",
  5: "heeb-5",
  6: "heeb-6-the-guilt-issue",
  7: "heeb-7-beastie-boys",
  9: "heeb-9-the-sex-issue",
  10: "heeb-10",
  11: "heeb-11",
  12: "heeb-12",
  13: "heeb-13",
  14: "copy-of-heeb-14",
  15: "heeb-9-the-goy-issue",
  16: "from-hollywood-with-love-jason-segel",
  17: "the-notorious-issue-bar-rafaeli",
  18: "the-politics-issue",
  19: "courtney-love",
  20: "the-music-issue-1",
};

export function backIssueHandleForNumber(issueNumber) {
  if (issueNumber == null || issueNumber === "") return null;
  return BACK_ISSUE_HANDLES[Number(issueNumber)] || null;
}
