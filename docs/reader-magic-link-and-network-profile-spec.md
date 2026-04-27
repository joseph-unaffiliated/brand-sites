# Reader magic-link sign-in & network profile (future work)

This document captures a **planned** cross-brand reader experience. It is **not implemented** as of the date it was added; use it when prioritizing engineering work and onboarding agents to the intended architecture.

## Product goals

1. **Duplicate email on subscribe**  
   If someone submits the subscribe form with an email that **already has a subscription** (for this brand or the network), **do not** treat it as a new signup. Instead, send a **transactional email** with a **time-limited sign-in link**.

2. **Sign-in from email**  
   When they open the link, they land on the publication site in an **authenticated** state: a durable session is established so the UI can treat them as “logged in” (see storage notes below).

3. **Logged-in UX (network-wide intent)**  
   - **(a)** Suppress subscribe CTAs / inline subscribe modules where inappropriate (they are already known to the system).  
   - **(b)** Replace the header **Subscribe** control with a **profile** affordance (e.g. icon).  
   - **(c)** Profile surface lets them manage **this brand’s** subscription and see / manage **other brands in the network** they are tied to.

## Current baseline (today)

- Marketing apps use **`SubscriberContext`** and **`localStorage`** keys (e.g. `subscribed_${brandId}`, `email_${brandId}`) to drive “subscribed” UI after a successful subscribe flow on that site.  
- **`/profile`** and **`fetchVerifiedSubscriptions`** already assume a **Bearer reader token** from **`magic.*`** (`/api/reader-subscriptions`) for **verified** cross-brand subscription lists—not ad-hoc BigQuery from the browser.  
- **`SubscribePopup`** opens from `#subscribe` and wraps **`SubscribeBlock`**; the header CTA opens that flow.

When building the new system, decide whether to **extend** the existing token + `magic.*` pattern or **replace** pieces of the local-only subscriber flags with server-backed session state.

## Proposed high-level architecture

### A. Subscription / duplicate detection

- **Authoritative check** (“is this email already subscribed for brand X / network?”) should live on a **trusted backend** (e.g. **`magic.*`** subscription-functions), **not** in the Next.js marketing app doing raw BigQuery or email-keyed lookups from the client.  
- **BigQuery** (if used) is a reasonable **batch / analytics / reconciliation** layer or internal ops view; **runtime** decisions for “send magic link vs create subscription” should go through an API that enforces auth, rate limits, and privacy.  
- Marketing app **subscribe API route** (or server action): validate input, call **`magic.*`** (or a dedicated endpoint) that:  
  - resolves subscriber + brand subscriptions;  
  - returns `{ action: "subscribe" | "magic_link_sent" }` or similar;  
  - never exposes raw warehouse rows to the browser.

### B. Transactional email (Customer.io)

- On **`magic_link_sent`** (or equivalent), backend triggers **Customer.io** (or queues an event CIO listens to) with template variables: brand name, sign-in URL, expiry, optional pre-filled email.  
- **Secrets** for CIO and link signing live on **`magic.*`** / serverless—not `NEXT_PUBLIC_*`.  
- Templates, deliverability, and unsubscribe compliance live in CIO; **link host** should be the publication domain or a stable redirect domain you control.

### C. Magic link token & landing

- Link contains a **one-time or short-lived signed token** (JWT or opaque id resolved server-side).  
- Dedicated route (e.g. `/auth/callback` or `/sign-in/complete`) **exchanges** the token for:  
  - an **httpOnly, Secure, SameSite** session cookie (preferred for actual auth), and/or  
  - a **reader token** compatible with existing **`getReaderToken` / `fetchVerifiedSubscriptions`** flows.  
- **localStorage**: today’s apps use it for subscriber UI flags. For the new flow, either:  
  - **mirror** server session into the same keys for minimal UI churn, or  
  - **migrate** UI to read from a single “session ready” signal set only after successful callback.  
- Document **logout**: clear cookie + clear local keys + CIO profile if needed.

### D. Customer-facing UI changes (when implemented)

| Area | Behavior |
|------|----------|
| Subscribe forms | Hide or replace with “Manage subscription” / “You’re signed in” when session says already known. |
| Header CTA | Profile icon → `/profile` (or hub); no redundant subscribe button. |
| Profile page | Already oriented to network lists when token exists; extend for sign-out, per-brand prefs, resend link, etc. |

### E. Security & abuse

- Rate-limit magic-link requests **per email + IP**.  
- Constant-time responses where possible to avoid email enumeration (or explicit product choice to reveal “already subscribed”).  
- Short TTL on tokens; single-use redemption.  
- Audit trail (server logs / BQ events) without PII in client bundles.

### F. Monorepo & deploy notes

- **`AGENTS.md`**: one Vercel project per app; keep **secrets off** marketing unless unavoidable.  
- Any new **`magic.*`** routes or CIO triggers should be reflected in **`docs/ARCHITECTURE.md`** and **`docs/DEPLOYMENT.md`** when implemented.

## Suggested implementation phases

1. **Backend contract** on `magic.*`: “check subscriber + enqueue CIO magic link” + “exchange token for session/reader token.”  
2. **Marketing subscribe path**: branch on API response; no client-side warehouse access.  
3. **Callback route** on each app (or shared package) + align **`SubscriberContext`** with cookie/token lifecycle.  
4. **UI pass**: header, **`SubscribeBlock`**, **`SubscribePopup`**, article footers, `/profile` empty states.  
5. **QA**: expired link, wrong brand, cross-device, logout, CIO template previews.

## Open questions (resolve before build)

- Exact **enumeration policy** (tell user “already subscribed” vs generic “check your email”).  
- **Single network account** vs per-brand tokens.  
- Whether **profile hub** lives on one canonical domain vs each `www.*` site.  
- **GDPR / retention** for magic-link audit logs.

## Quick file map (starting points)

- `apps/*/src/components/Header.js` — header CTA / profile icon.  
- `apps/*/src/components/SubscribePopup.js`, `SubscribeBlock*.js` — subscribe surfaces.  
- `apps/*/src/context/SubscriberContext.js` — client subscriber state.  
- `apps/*/src/app/profile/page.js` — profile / network discovery.  
- `apps/*/src/lib/reader-profile.js` (or equivalent) — token + `magic.*` fetch helpers.

---

*When picking up this work, link the implementing PR(s) here or in `docs/ARCHITECTURE.md` so this spec stays traceable.*
