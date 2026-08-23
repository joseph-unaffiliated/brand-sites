/**
 * Client helpers for TPR giveaway + subscribe/sign-in magic APIs.
 */

import { getReaderToken } from "@/lib/reader-profile";
import { storeReaderTokenFromResponse } from "@publication-websites/magic-client";
import { siteConfig } from "@/config/site";

function giveawayApiUrl() {
  const origin = siteConfig.magicReaderApiOrigin.replace(/\/$/, "");
  return `${origin}/api/giveaway`;
}

/**
 * @param {Record<string, unknown>} body
 * @param {{ bearer?: boolean }} [opts]
 */
export async function callGiveawayApi(body, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  if (opts.bearer) {
    const token = getReaderToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(giveawayApiUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Giveaway API ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  if (data.readerToken) {
    storeReaderTokenFromResponse(data);
  }
  return data;
}

export function daysUntilCopy(days) {
  if (days == null) return "";
  if (days <= 0) return "The draw has closed.";
  if (days === 1) return "1 day remains until the draw.";
  return `${days} days remain until the draw.`;
}
