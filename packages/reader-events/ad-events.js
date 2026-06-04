import { flush } from "./collector.js";
import { track } from "./track.js";

/**
 * @param {{ placement?: string, adType?: string, destinationUrl?: string, creativeBrand?: string }} props
 */
export function trackAdImpression(props = {}) {
  track("ad_impression", props);
}

/**
 * @param {{ placement?: string, adType?: string, destinationUrl?: string, creativeBrand?: string }} props
 */
export function trackAdClick(props = {}) {
  track("ad_click", props);
  flush(true);
}
