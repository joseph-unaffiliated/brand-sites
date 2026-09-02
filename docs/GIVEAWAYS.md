# TPR first-party giveaways — ESP merge tags & QA

First-party giveaway attribution uses `?ref=CODE` on marketing URLs and magic `POST /api/giveaway`. Sparkloop stays optional and separate.

Campaign copy/dates live in `apps/thepicklereport/src/config/giveaways.js` (Sanity deferred).

## Unlisted vs public

Set `listed: true` on a campaign to put it in the sitemap, allow `/giveaway` in robots.txt, and show an “Enter …” promo on profile for people who have not entered.

Until then (`listed: false` or omitted): landing and `/entered` stay **noindex**, robots **Disallow: /giveaway**, and the profile does not advertise the contest. Direct URLs, `?ref=` partner links, and CIO emails still work. Flip `listed` when you want the contest findable.

`/sign-in` is always noindex and disallowed in robots (utility page). Header **Subscribe** stays visible; that is not the contest.

## Tracking links

| Surface | URL pattern |
|--------|-------------|
| Landing | `https://www.thepicklereport.com/giveaway/{slug}?ref={CODE}` |
| Instant enter (no email confirm) | `/giveaway/{slug}/entered?email=…&ref={CODE}` — page runs subscribe + enter |
| Magic one-click subscribe (ESP) | `{magicSubscribeBase}?email={{customer.email}}&ref={CODE}&giveaway={slug}&utm_source=…&utm_campaign=…` |

On successful subscribe/enter, magic credits the code owner (no self-credit). The landing form sends people straight to `/entered` (subscribe + enter in-browser). Confirm/enter emails from `POST /api/giveaway` `start` remain available for ESP or legacy links.

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
- [ ] Unsigned email: form → `/entered` subscribe + enter (no confirm email)
- [ ] `?ref=` credits referrer; self-ref does not
- [ ] Subscribe form already-subscribed → toast + sign-in email (not new-sub success)
- [ ] Header shows Subscribe when logged out
- [ ] Partner (`isPartner` in BQ): profile create/copy links + credited counts
- [ ] Non-partner: personal referral stats for entered giveaways only
- [ ] `listed: true` → sitemap + robots allow + profile promo; `false` → unlisted

## Partner / influencer tracking

Same `?ref=` system as personal share links; partner codes are a separate type.

### Ops (preferred): Unaffiliated Analytics

1. Open **[Giveaway partners](https://my.unaffiliated.co/tools/giveaways)** (Tools access).
2. Enter the partner’s email + optional label → **Create / reuse tracking link**.
   - Sets `isPartner = TRUE` in BigQuery
   - Mints (or reuses) a `p…` partner code for the campaign
3. Copy and send them:
   - **Tracking URL** — `https://www.thepicklereport.com/giveaway/{slug}?ref={code}`
   - **Dashboard URL** — `https://my.unaffiliated.co/partner/giveaway/{code}` (public performance page)
4. When the giveaway ends: **Deactivate link** or **End partner** from the same tool.

### Manual / profile fallback

1. In BigQuery `analytics.users`, set `isPartner = TRUE` for the partner’s email.
2. Partner signs in on thepicklereport.com → **Profile** → Giveaways → **Create tracking link**.
3. Optional UTMs for analytics (`utm_source=partner&utm_campaign={slug}`) — credit still keys off `ref` only.

You do **not** need a separate landing page per partner. One giveaway URL + unique `ref` is enough.

## Ops

- Run `subscription-functions/docs/sql/CREATE_GIVEAWAY_TABLES.sql` once in GCP.
- Optional: `ALTER TABLE …users ADD COLUMN IF NOT EXISTS isPartner BOOL;` then flag partners via Analytics tool or manually.
- Secrets stay on magic (`READER_TOKEN_SECRET`, `CIO_*`, `GCP_*`, `INTERNAL_ANALYTICS_SECRET`); marketing apps never query BQ by email.
- Magic routes: `POST /api/giveaway` (reader) and `POST /api/internal/giveaway-admin` (Analytics staff).
