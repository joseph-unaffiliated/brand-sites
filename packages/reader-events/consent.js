/**
 * Gate reader-events on OneTrust when present; allow all when consent tooling absent (dev).
 */

export const ANALYTICS_CONSENT_EVENT = "reader-analytics-consent-granted";

export function hasAnalyticsConsent() {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_READER_EVENTS_REQUIRE_CONSENT === "false") {
    return true;
  }
  const groups = window.OptanonActiveGroups;
  if (typeof groups === "string") {
    // OneTrust typically uses "C0002" for analytics — also allow if any non-essential accepted
    return groups.includes("C0002") || groups.split(",").filter(Boolean).length > 1;
  }
  // No OneTrust loaded yet — wait (collector retries on track)
  if (window.OneTrust) return false;
  // No consent banner on this site
  return true;
}

let consentNotified = false;

/**
 * Fire `reader-analytics-consent-granted` once when Performance/analytics consent is granted.
 * @returns {() => void} cleanup
 */
export function subscribeAnalyticsConsent() {
  if (typeof window === "undefined") return () => {};

  const maybeNotify = () => {
    if (consentNotified || !hasAnalyticsConsent()) return;
    consentNotified = true;
    window.dispatchEvent(new CustomEvent(ANALYTICS_CONSENT_EVENT));
  };

  maybeNotify();
  if (consentNotified) return () => {};

  const onChange = () => maybeNotify();
  window.addEventListener("OneTrustGroupsUpdated", onChange);

  const pollId = window.setInterval(onChange, 1000);
  const stopPoll = window.setTimeout(() => window.clearInterval(pollId), 60000);

  return () => {
    window.removeEventListener("OneTrustGroupsUpdated", onChange);
    window.clearInterval(pollId);
    window.clearTimeout(stopPoll);
  };
}
