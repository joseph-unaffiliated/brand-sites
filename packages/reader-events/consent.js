/**
 * Gate reader-events on OneTrust when present; allow all when consent tooling absent (dev).
 */

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
