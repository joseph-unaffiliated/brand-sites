import { getReaderToken } from "./token.js";

export function isReaderProfileV2Enabled() {
  return process.env.NEXT_PUBLIC_READER_PROFILE_V2 === "true";
}

/**
 * @param {string | null} readerToken
 * @param {string} apiOrigin
 */
export async function fetchVerifiedSubscriptions(readerToken, apiOrigin) {
  if (!readerToken) {
    return { subscribedBrands: [] };
  }
  const base = apiOrigin.replace(/\/$/, "");
  const res = await fetch(`${base}/api/reader-subscriptions`, {
    method: "GET",
    headers: { Authorization: `Bearer ${readerToken}` },
    credentials: "omit",
  });
  if (!res.ok) {
    const err = new Error("reader-subscriptions failed");
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Full profile from reader-profile API; falls back to reader-subscriptions on error.
 * @param {string | null} readerToken
 * @param {string} apiOrigin
 * @param {string} fallbackBrandId
 */
export async function fetchReaderProfile(readerToken, apiOrigin, fallbackBrandId) {
  if (!readerToken) {
    return {
      subscribedBrands: fallbackBrandId ? [fallbackBrandId] : [],
      readArticles: {},
      engagement: {},
      recommendations: [],
    };
  }

  const base = apiOrigin.replace(/\/$/, "");

  if (isReaderProfileV2Enabled()) {
    try {
      const res = await fetch(`${base}/api/reader-profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${readerToken}` },
        credentials: "omit",
      });
      if (res.ok) {
        return res.json();
      }
    } catch {
      /* fall through */
    }
  }

  const data = await fetchVerifiedSubscriptions(readerToken, apiOrigin);
  return {
    ...data,
    readArticles: {},
    engagement: {},
    recommendations: [],
  };
}
