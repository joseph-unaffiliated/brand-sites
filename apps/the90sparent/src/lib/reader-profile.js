/**
 * Profile page: load verified cross-brand subscriptions from magic.* using a
 * short-lived token stored after /execute (see magic-client.storeReaderTokenFromResponse).
 */

import { siteConfig } from "@/config/site";

const STORAGE_KEY = "magic_reader_token";

export function getReaderToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearReaderToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * @param {string | null} readerToken
 * @returns {Promise<{ email?: string; subscribedBrands: string[] }>}
 */
export async function fetchVerifiedSubscriptions(readerToken) {
  if (!readerToken) {
    return { subscribedBrands: [] };
  }
  const base = siteConfig.magicReaderApiOrigin.replace(/\/$/, "");
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
