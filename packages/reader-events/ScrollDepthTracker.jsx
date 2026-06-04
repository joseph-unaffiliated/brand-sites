"use client";

import { useScrollDepth } from "./hooks.js";

/** Scroll depth milestones (25/50/75/100%) once per article per session. */
export default function ScrollDepthTracker({ slug, enabled = true }) {
  useScrollDepth(slug, enabled);
  return null;
}
