"use client";

import { useMemo } from "react";
import {
  executeUrlFromSignupUrl,
  resolveSparkloopTestMode,
  useNewsletterPicker,
} from "@publication-websites/sparkloop-client";
import { siteConfig } from "@/config/site";
import { networkBrands } from "@/data/networkNewsletters";
import { subscriptionSuccessRecs } from "@/data/subscriptionSuccessRecs";
import actions from "./SubscriptionPageActions.module.css";

const byId = Object.fromEntries(networkBrands.map((b) => [b.id, b]));

const SPARKLOOP_LIMIT = 3;

/**
 * @param {{ email: string | null }} props
 */
export default function SubscriptionSuccessRecs({ email }) {
  if (!email) return <NetworkLinks />;
  return <NewsletterPicker email={email} />;
}

/** No email to subscribe with — link out to our brands only. */
function NetworkLinks() {
  return (
    <section className={actions.recs} aria-label="You might also enjoy">
      <p className={actions.recsTitle}>You might also enjoy&hellip;</p>
      <ul className={actions.recsList}>
        {subscriptionSuccessRecs.map((row) => {
          const brand = byId[row.id];
          if (!brand) return null;
          return (
            <li key={row.id} className={actions.rec}>
              <span className={actions.recName}>{brand.displayName || brand.name}</span>
              <p className={actions.recDek}>{row.description}</p>
              <div className={actions.recActions}>
                <a className={actions.recVisit} href={`https://${row.id}.com`}>
                  visit site
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * @param {{ email: string }} props
 */
function NewsletterPicker({ email }) {
  const networkItems = useMemo(
    () =>
      subscriptionSuccessRecs
        .map((row) => {
          const brand = byId[row.id];
          if (!brand) return null;
          return {
            key: `net:${row.id}`,
            kind: "network",
            brandId: row.id,
            executeUrl: executeUrlFromSignupUrl(brand.signupUrl),
            name: brand.displayName || brand.name,
            description: row.description,
          };
        })
        .filter(Boolean),
    []
  );

  const { items, loadState, selected, toggle, submit, submitState, observeRecommendation } =
    useNewsletterPicker({
      email,
      sourceBrand: siteConfig.brandId,
      networkItems,
      sparkloop: {
        publicationId: siteConfig.sparkloopPublicationId,
        testMode: resolveSparkloopTestMode(siteConfig.sparkloopTestMode),
        limit: SPARKLOOP_LIMIT,
      },
    });

  if (loadState === "loading") {
    return (
      <section className={actions.recs} aria-label="You might also enjoy" aria-busy="true">
        <p className={actions.recsTitle}>You might also enjoy&hellip;</p>
      </section>
    );
  }

  if (submitState.status === "done") {
    const names = submitState.subscribed.map((item) => item.name).join(", ");
    const failedNames = submitState.failed.map((item) => item.name).join(", ");
    return (
      <section className={actions.recs} aria-live="polite">
        <p className={actions.recsTitle}>You&apos;re in: {names}.</p>
        {failedNames ? (
          <p className={actions.pickerNote}>
            We couldn&apos;t add {failedNames}. You can try again later.
          </p>
        ) : null}
      </section>
    );
  }

  const count = selected.size;
  const submitting = submitState.status === "submitting";

  return (
    <section className={actions.recs} aria-label="You might also enjoy">
      <p className={actions.recsTitle}>You might also enjoy&hellip;</p>
      <ul className={actions.pickerGrid}>
        {items.map((item) => {
          const checked = selected.has(item.key);
          const isSparkloop = item.kind === "sparkloop";
          return (
            <li
              key={item.key}
              ref={isSparkloop ? observeRecommendation : undefined}
              data-recommendation-uuid={isSparkloop ? item.uuid : undefined}
            >
              <label className={`${actions.pickerCard} ${checked ? actions.pickerCardSelected : ""}`}>
                <input
                  type="checkbox"
                  className={actions.pickerInput}
                  checked={checked}
                  onChange={() => toggle(item.key)}
                  disabled={submitting}
                />
                <span className={actions.recName}>{item.name}</span>
                <span className={actions.pickerDek}>{item.description}</span>
                <span className={actions.pickerToggle} aria-hidden="true">
                  {checked ? "Added \u2713" : "Add"}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className={actions.pickerSubmitRow}>
        <button
          type="button"
          className={`${actions.btn} ${actions.btnPrimary}`}
          onClick={submit}
          disabled={count === 0 || submitting}
        >
          {submitting
            ? "Subscribing\u2026"
            : count === 0
              ? "Pick any you like"
              : `Subscribe to ${count} newsletter${count === 1 ? "" : "s"}`}
        </button>
        <p className={actions.pickerNote}>
          Subscribes {email}. Some picks are partner newsletters.
        </p>
        {submitState.status === "error" ? (
          <p className={actions.pickerNote} role="alert">
            Something went wrong. Please try again.
          </p>
        ) : null}
      </div>
    </section>
  );
}
