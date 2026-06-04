/**
 * Decode email from marketing URL query params (CIO / magic links).
 * @param {string | null | undefined} raw
 * @returns {string | null}
 */
export function decodeEmailParam(raw) {
  if (!raw || typeof raw !== "string") return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Remove PII query params after successful session bootstrap.
 * @param {string[]} [keys]
 */
export function stripSearchParams(keys = ["email", "userID"]) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of keys) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", next);
}
