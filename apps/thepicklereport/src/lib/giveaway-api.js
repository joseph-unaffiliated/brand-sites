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
    if (!token) {
      const err = new Error("Unauthorized");
      err.status = 401;
      err.data = { error: "Unauthorized" };
      throw err;
    }
    headers.Authorization = `Bearer ${token}`;
  }
  const controller = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 25000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(giveawayApiUrl(), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e?.name === "AbortError") {
      const err = new Error("Giveaway API timed out");
      err.status = 408;
      err.data = { error: "timeout" };
      throw err;
    }
    throw e;
  }
  clearTimeout(timer);
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
