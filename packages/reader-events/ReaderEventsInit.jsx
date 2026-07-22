"use client";

import { useEffect } from "react";
import { initReaderEventsCollector } from "./collector.js";
import { subscribeAnalyticsConsent } from "./consent.js";
import { isReaderEventsEnabled } from "./constants.js";
import GaIdentityBridge from "./GaIdentityBridge.jsx";
import PageViewTracker from "./PageViewTracker.jsx";

/**
 * Initialize reader-events collector once per app (inside SubscriberProvider).
 * GA identity bridge always mounts when brandId + apiOrigin are set.
 */
export default function ReaderEventsInit({ brandId, apiOrigin }) {
  useEffect(() => {
    if (!isReaderEventsEnabled()) return undefined;
    initReaderEventsCollector({ brandId, apiOrigin });
    return subscribeAnalyticsConsent();
  }, [brandId, apiOrigin]);

  return (
    <>
      <GaIdentityBridge brandId={brandId} apiOrigin={apiOrigin} />
      {isReaderEventsEnabled() ? <PageViewTracker /> : null}
    </>
  );
}
