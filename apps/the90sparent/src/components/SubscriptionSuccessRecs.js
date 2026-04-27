"use client";

import { networkBrands } from "@/data/networkNewsletters";
import { subscriptionSuccessRecs } from "@/data/subscriptionSuccessRecs";
import actions from "./SubscriptionPageActions.module.css";

const byId = Object.fromEntries(networkBrands.map((b) => [b.id, b]));

/**
 * @param {{ email: string | null }} props
 */
export default function SubscriptionSuccessRecs({ email }) {
  return (
    <section className={actions.recs} aria-label="You might also enjoy">
      <p className={actions.recsTitle}>You might also enjoy&hellip;</p>
      <ul className={actions.recsList}>
        {subscriptionSuccessRecs.map((row) => {
          const brand = byId[row.id];
          if (!brand) return null;
          const name = brand.displayName || brand.name;
          const magicHref = email
            ? (() => {
                const u = new URL(brand.signupUrl);
                u.searchParams.set("email", email);
                return u.toString();
              })()
            : null;
          const visitBase = `https://${row.id}.com`;
          const visitQuery = email ? `?email=${encodeURIComponent(email)}` : "";
          return (
            <li key={row.id} className={actions.rec}>
              <span className={actions.recName}>{name}</span>
              <p className={actions.recDek}>{row.description}</p>
              <div className={actions.recActions}>
                {email && magicHref ? (
                  <a className={actions.btn} href={magicHref}>
                    Add to Inbox
                  </a>
                ) : null}
                <a className={actions.recVisit} href={`${visitBase}${visitQuery}`}>
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
