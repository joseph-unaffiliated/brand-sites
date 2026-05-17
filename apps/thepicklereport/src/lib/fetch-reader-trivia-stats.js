import { siteConfig } from "@/config/site";

/**
 * GET aggregated trivia stats from magic (when /api/reader-trivia-stats exists).
 * @param {string | null | undefined} bearerToken
 */
export async function fetchReaderTriviaStats(bearerToken) {
  const origin = siteConfig.magicReaderApiOrigin?.replace(/\/$/, "");
  if (!origin || !bearerToken) return null;

  try {
    const res = await fetch(`${origin}/api/reader-trivia-stats`, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
