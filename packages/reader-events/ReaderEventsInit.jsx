"use client";

import { useEffect } from "react";
import { initReaderEventsCollector } from "./collector.js";
import { subscribeAnalyticsConsent } from "./consent.js";
import { isReaderEventsEnabled } from "./constants.js";
import PageViewTracker from "./PageViewTracker.jsx";

/**
 * Initialize reader-events collector once per app (inside SubscriberProvider).
 */
export default function ReaderEventsInit({ brandId, apiOrigin }) {
  useEffect(() => {
    if (!isReaderEventsEnabled()) return;
    initReaderEventsCollector({ brandId, apiOrigin });
    return subscribeAnalyticsConsent();
  }, [brandId, apiOrigin]);

  if (!isReaderEventsEnabled()) return null;

  return <PageViewTracker />;
}
