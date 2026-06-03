import { enqueueEvent } from "./collector.js";

export function track(eventType, properties = {}) {
  enqueueEvent(eventType, properties);
}
