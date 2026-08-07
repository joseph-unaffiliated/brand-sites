export const EVENT_TYPES = [
  "page_view",
  "article_view",
  "scroll_depth",
  "subscribe_form_start",
  "subscribe_form_submit",
  "poll_view",
  "poll_vote",
  "trivia_answer",
  "trivia_complete",
  "ad_impression",
  "ad_click",
  "profile_view",
  "subscription_manage",
  "favorite_add",
  "favorite_remove",
];

export const SCROLL_MILESTONES = [25, 50, 75, 100];
export const MAX_READ_SLUGS_PER_BRAND = 200;
export const MAX_FAVORITE_SLUGS_PER_BRAND = 500;

export function isReaderEventsEnabled() {
  return process.env.NEXT_PUBLIC_READER_EVENTS_ENABLED === "true";
}

/** Funnel events allowed without readerToken (sessionID only → BQ). */
export const SESSION_ONLY_EVENT_TYPES = new Set([
  "subscribe_form_start",
  "subscribe_form_submit",
]);

export function isSessionOnlyEventType(eventType) {
  return SESSION_ONLY_EVENT_TYPES.has(eventType);
}

/**
 * Ad metrics: allowed without readerToken (sessionID → BQ).
 * When a token is present, the API still ingests as identified (lead marking).
 */
export const ANONYMOUS_OK_EVENT_TYPES = new Set(["ad_impression", "ad_click"]);

export function isAnonymousOkEventType(eventType) {
  return ANONYMOUS_OK_EVENT_TYPES.has(eventType);
}

/** Preference actions: need readerToken, skip analytics consent gate. */
export const PREFERENCE_EVENT_TYPES = new Set(["favorite_add", "favorite_remove"]);

export function isPreferenceEventType(eventType) {
  return PREFERENCE_EVENT_TYPES.has(eventType);
}
