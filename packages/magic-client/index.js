/**
 * Browser-side calls to each publication’s magic host (/execute).
 *
 * Non-technical readers: “Magic” is our secure server that confirms newsletter
 * sign-ups and snoozes. This file is only the small browser helper that talks to it.
 */

/** @typedef {{ brand: string; executeUrl: string }} MagicClientConfig */

export function isRealBrowser() {
  if (typeof navigator === "undefined" || typeof document === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  // Hard rejects — CIO link scanners and headless clients must never auto-opt-out.
  if (!ua) return false;
  if (navigator.webdriver === true) return false;
  if (
    /customer\.io|bot|crawler|spider|scanner|prefetch|headless|preview/i.test(ua)
  ) {
    return false;
  }

  const softChecks = {
    hasPlugins: navigator.plugins && navigator.plugins.length > 0,
    localStorageWorks: (() => {
      try {
        localStorage.setItem("__test__", "1");
        localStorage.removeItem("__test__");
        return true;
      } catch {
        return false;
      }
    })(),
    pageVisible: document.visibilityState === "visible",
  };
  // Require at least two soft signals in addition to hard rejects above.
  return Object.values(softChecks).filter(Boolean).length >= 2;
}

export const READER_TOKEN_STORAGE_KEY = "magic_reader_token";
export const USER_ID_STORAGE_KEY = "magic_user_id";

/**
 * Persist warehouse userID for GA stitching / profile.
 * @param {string} userID
 */
export function storeUserId(userID) {
  if (typeof window === "undefined") return;
  if (!userID || typeof userID !== "string") return;
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, userID);
    window.dispatchEvent(new CustomEvent("magic-user-id-updated", { detail: { userID } }));
  } catch {
    /* ignore quota / private mode */
  }
}

/**
 * @returns {string | null}
 */
export function getUserId() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(USER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * If the magic server returned a readerToken / userID, store for profile + GA stitching.
 * Token is opaque; do not log it.
 * @param {unknown} data
 */
export function storeReaderTokenFromResponse(data) {
  if (typeof window === "undefined") return;
  if (!data || typeof data !== "object") return;
  const body = /** @type {{ readerToken?: string; userID?: string }} */ (data);
  if (body.userID && typeof body.userID === "string") {
    storeUserId(body.userID);
  }
  if (body.readerToken && typeof body.readerToken === "string") {
    try {
      localStorage.setItem(READER_TOKEN_STORAGE_KEY, body.readerToken);
      window.dispatchEvent(new CustomEvent("magic-reader-token-updated"));
    } catch {
      /* ignore quota / private mode */
    }
  }
}

/**
 * @param {MagicClientConfig} cfg
 * @param {URLSearchParams} searchParams
 * @param {string} action subscribe | unsubscribe | snooze
 */
export async function executeAction(cfg, searchParams, action) {
  const encodedEmail = searchParams.get("email");
  if (!encodedEmail) throw new Error("No email");

  const email = decodeURIComponent(encodedEmail);

  const body = { email, brand: cfg.brand, action };

  const brands = searchParams.get("brands");
  const campaignID = searchParams.get("campaignID");
  const utm_source = searchParams.get("utm_source");
  const utm_campaign = searchParams.get("utm_campaign");
  const articleID = searchParams.get("articleID");

  if (brands) body.brands = brands;
  if (campaignID) body.campaignID = campaignID;
  if (utm_source) body.utm_source = utm_source;
  if (utm_campaign) body.utm_campaign = utm_campaign;
  if (articleID) body.articleID = articleID;

  const response = await fetch(cfg.executeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (response.ok) {
    storeReaderTokenFromResponse(data);
  }
  return data;
}

export function getReaderToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(READER_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearReaderToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(READER_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Resolve userID from localStorage or GET /api/reader-identity when a readerToken exists.
 * @param {string} apiOrigin magic origin (no trailing slash)
 * @returns {Promise<string | null>}
 */
export async function ensureUserId(apiOrigin) {
  const existing = getUserId();
  if (existing) return existing;
  const token = getReaderToken();
  const origin = (apiOrigin || "").replace(/\/$/, "");
  if (!token || !origin) return null;
  try {
    const res = await fetch(`${origin}/api/reader-identity`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json().catch(() => ({}));
    if (data?.userID && typeof data.userID === "string") {
      storeUserId(data.userID);
      return data.userID;
    }
  } catch {
    /* ignore */
  }
  return null;
}
