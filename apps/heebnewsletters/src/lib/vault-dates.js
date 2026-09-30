/**
 * Original-print dates for vault issues. `originalPublication` is free text
 * like "HEEB #12, Spring 2007" or "Heeb #7 Fall/Winter 2004"; `originalYear`
 * is the canonical year.
 */

const SEASON_ORDER = { winter: 0, spring: 1, summer: 2, fall: 3, autumn: 3 };

function parseOriginal(issue) {
  const text = String(issue?.originalPublication || "");
  const seasonMatch = text.match(/\b((?:winter|spring|summer|fall|autumn)(?:\s*\/\s*(?:winter|spring|summer|fall|autumn))?)\b/i);
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  const numberMatch = text.match(/#\s*(\d+)/);
  const year = Number(issue?.originalYear) || (yearMatch ? Number(yearMatch[0]) : null);
  const season = seasonMatch ? seasonMatch[1].replace(/\s*\/\s*/, "/") : null;
  const firstSeason = season ? season.split("/")[0].toLowerCase() : null;
  return {
    year,
    season,
    seasonRank: firstSeason != null ? SEASON_ORDER[firstSeason] ?? -1 : -1,
    issueNumber: numberMatch ? Number(numberMatch[1]) : null,
  };
}

function titleCase(value) {
  return value.replace(/\b[a-z]/gi, (c) => c.toUpperCase()).replace(/\B[A-Z]/g, (c) => c.toLowerCase());
}

/** "Spring 2007", or just "2007" when the season isn't recorded. */
export function originalDateLabel(issue) {
  const { year, season } = parseOriginal(issue);
  if (!year) return null;
  return season ? `${titleCase(season)} ${year}` : String(year);
}

/** Most recently printed first; issue number breaks ties; undated last. */
export function compareOriginalDateDesc(a, b) {
  const pa = parseOriginal(a);
  const pb = parseOriginal(b);
  if (pa.year != null && pb.year == null) return -1;
  if (pa.year == null && pb.year != null) return 1;
  if (pa.year !== pb.year) return pb.year - pa.year;
  if (pa.issueNumber != null && pb.issueNumber != null && pa.issueNumber !== pb.issueNumber) {
    return pb.issueNumber - pa.issueNumber;
  }
  if (pa.seasonRank !== pb.seasonRank) return pb.seasonRank - pa.seasonRank;
  return String(a?.title || "").localeCompare(String(b?.title || ""));
}
