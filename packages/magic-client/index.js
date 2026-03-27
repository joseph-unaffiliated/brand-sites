/**
 * Browser-side calls to each publication’s magic host (/execute).
 *
 * Non-technical readers: “Magic” is our secure server that confirms newsletter
 * sign-ups and snoozes. This file is only the small browser helper that talks to it.
 */

/** @typedef {{ brand: string; executeUrl: string }} MagicClientConfig */

export function isRealBrowser() {
  const checks = {
    hasUserAgent: !!navigator.userAgent,
    notHeadless: navigator.webdriver === undefined,
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
    notKnownBot: !/bot|crawler|spider|scanner|preview/i.test(navigator.userAgent),
  };
  return Object.values(checks).filter(Boolean).length >= 4;
}

/**
 * If the magic server returned a readerToken, store it for the profile page.
 * Token is opaque; do not log it.
 * @param {unknown} data
 */
export function storeReaderTokenFromResponse(data) {
  if (typeof window === "undefined") return;
  if (!data || typeof data !== "object") return;
  const token = /** @type {{ readerToken?: string }} */ (data).readerToken;
  if (token && typeof token === "string") {
    try {
      localStorage.setItem("magic_reader_token", token);
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
