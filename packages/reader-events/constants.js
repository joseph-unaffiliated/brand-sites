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
];

export const SCROLL_MILESTONES = [25, 50, 75, 100];
export const MAX_READ_SLUGS_PER_BRAND = 200;

export function isReaderEventsEnabled() {
  return process.env.NEXT_PUBLIC_READER_EVENTS_ENABLED === "true";
}
