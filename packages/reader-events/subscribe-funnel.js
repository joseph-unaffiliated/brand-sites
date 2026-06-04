import { flush } from "./collector.js";
import { track } from "./track.js";

/**
 * @param {{ placement?: string; articleSlug?: string }} [props]
 */
export function trackSubscribeFormStart(props = {}) {
  track("subscribe_form_start", props);
}

/**
 * @param {{ placement?: string; articleSlug?: string }} [props]
 */
export function trackSubscribeFormSubmit(props = {}) {
  track("subscribe_form_submit", props);
  flush(true);
}
