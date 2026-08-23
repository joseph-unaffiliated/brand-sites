# TPR first-party giveaways — ESP merge tags & QA

First-party giveaway attribution uses `?ref=CODE` on marketing URLs and magic `POST /api/giveaway`. Sparkloop stays optional and separate.

Campaign copy/dates live in `apps/thepicklereport/src/config/giveaways.js` (Sanity deferred).

## Tracking links

| Surface | URL pattern |
|--------|-------------|
| Landing | `https://www.thepicklereport.com/giveaway/{slug}?ref={CODE}` |
| Magic one-click subscribe (ESP) | `{magicSubscribeBase}?email={{customer.email}}&ref={CODE}&giveaway={slug}&utm_source=…&utm_campaign=…` |

On successful subscribe/enter, magic credits the code owner (no self-credit).

## Customer.io events (Track API)

Event-triggered automations in TPR workspace **198880** (running; re-enter on every matching event):

| Event | Automation | Useful attributes |
|-------|------------|-------------------|
| `giveaway_confirm_email` | [TPR Giveaway confirm email](https://fly.customer.io/workspaces/198880/journeys/automations/44) | `link`, `giveaway_slug`, `prize_line`, `draw_at`, `brand` |
| `giveaway_enter_link` | [TPR Giveaway enter link](https://fly.customer.io/workspaces/198880/journeys/automations/45) | same |
| `reader_sign_in_link` | [TPR Reader sign-in link](https://fly.customer.io/workspaces/198880/journeys/automations/46) | `link`, `return_path`, `brand` |

CTA buttons use `{{ event.link }}`. Prize/draw copy uses `{{ event.prize_line }}` and `{{ event.draw_at }}`. These are **not** the welcome segment trigger — each Track event starts a new journey.

Confirm / enter links redeem on `/giveaway/{slug}/entered?token=…`. Sign-in links redeem on `/sign-in?token=…`.

## ESP merge-tag checklist

1. Use warehouse `{{customer.id}}` (UUID), not `{{customer.cio_id}}`, when appending identity params.
2. Include `ref` + `giveaway` on magic subscribe links for partner posts.
3. Keep UTMs for analytics; giveaway credit keys off `ref` only.

## QA matrix

- [ ] Live slug `/giveaway/{slug}` shows prize, countdown, rules
- [ ] Ended slug still renders + links to current/upcoming
- [ ] Signed-in: one-click Enter → `/entered` with share link + tickets
- [ ] Unsigned new email: confirm email → redeem → subscribe + enter
- [ ] Unsigned existing email: enter-link email → redeem + enter
- [ ] `?ref=` credits referrer; self-ref does not
- [ ] Subscribe form already-subscribed → toast + sign-in email (not new-sub success)
- [ ] Header shows Subscribe / Sign in when logged out
- [ ] Partner (`isPartner` in BQ): profile create/copy links + credited counts
- [ ] Non-partner: personal referral stats for entered giveaways only

## Ops

- Run `subscription-functions/docs/sql/CREATE_GIVEAWAY_TABLES.sql` once in GCP.
- Optional: `ALTER TABLE …users ADD COLUMN IF NOT EXISTS isPartner BOOL;` then flag partners manually.
- Secrets stay on magic (`READER_TOKEN_SECRET`, `CIO_*`, `GCP_*`); marketing apps never query BQ by email.
- Magic route: `POST /api/giveaway` actions `start | enter | redeem | create_code | stats | subscribe_or_signin`.
