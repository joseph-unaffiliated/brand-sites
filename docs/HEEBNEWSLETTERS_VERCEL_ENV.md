# From the Vault, by Heeb — Vercel environment variables (copy/paste)

From the Vault is **its own brand**: marketing on `heebnewsletters.com`, subscriptions and reader APIs on **`magic.heebnewsletters.com`**. It does **not** share magic hosts or env defaults with any other brand.

Use this on the **marketing** Vercel project: **Root Directory** = `apps/heebnewsletters`.

**How to paste:** Vercel → Project → **Settings** → **Environment Variables** → add each line, or use **Import .env** and paste the block below (skip `#` comment lines if your importer rejects them).

**Legend**

| Marker | Meaning |
|--------|---------|
| `✅` | Matches repo defaults — paste as-is unless you intentionally change it |
| `⚠️ UPDATE` | Replace with your real value before saving |
| `⏭️ OPTIONAL` | Omit until you need the feature |

After saving: **Redeploy** Production (and Preview if you added vars there).

---

## Plain checklist (two Vercel projects)

### Marketing (`heebnewsletters.com`) — Root Directory `apps/heebnewsletters`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://heebnewsletters.com` |
| `NEXT_PUBLIC_BRAND_ID` | `heebnewsletters` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.heebnewsletters.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.heebnewsletters.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `m4gmd2lf` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `From the Vault, by Heeb` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `The 2000s in your inbox — a weekly dive into subversive Jewish counter-culture nostalgia from Heeb.` |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/ftv-wordmark-black.png` |
| `NEXT_PUBLIC_SITE_FAVICON` | `/ftv-favicon.ico` |
| `NEXT_PUBLIC_SITE_FAVICON_PNG` | `/ftv-favicon.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `The 2000s in your inbox. Delivered weekly.` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `The 2000s in your inbox` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@heebnewsletters.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Get From the Vault` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Subscribe card blurb |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` (slot → brand map is in `apps/heebnewsletters/src/config/crossPromoAds.js` — the '90s Parent + Pickle only; never From the Vault) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ UPDATE — new Meta pixel for this brand |
| `NEXT_PUBLIC_GTM_ID` | Same GTM container as other Unaffiliated sites |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⚠️ UPDATE — create a new GA4 property for this brand |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ⚠️ UPDATE — OneTrust domain script UUID for **heebnewsletters.com** |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

**Do not add to marketing:** `SANITY_API_TOKEN`, `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

**Do not set** `NEXT_PUBLIC_SHARED_ADS_BRAND=heebnewsletters` — house ads rotate other brands via `crossPromoAds.js`.

### Magic (`magic.heebnewsletters.com`) — separate Vercel project

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Generate once: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | `https://heebnewsletters.com,https://www.heebnewsletters.com,http://localhost:3007` |
| `GCP_PROJECT_ID` | Your GCP project |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for BigQuery/subscribers |

The brand also needs entries in the **subscription-functions** repo — follow `subscription-functions-copy/docs/ADDING_A_NEW_BRAND.md` with brand id `heebnewsletters`.

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`heebnewsletters.com`)

```env
# --- Core site & From the Vault magic only ---
NEXT_PUBLIC_SITE_URL=https://heebnewsletters.com
NEXT_PUBLIC_BRAND_ID=heebnewsletters
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.heebnewsletters.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.heebnewsletters.com

NEXT_PUBLIC_SANITY_PROJECT_ID=m4gmd2lf
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=From the Vault, by Heeb
NEXT_PUBLIC_SITE_DESCRIPTION=The 2000s in your inbox — a weekly dive into subversive Jewish counter-culture nostalgia from Heeb.
NEXT_PUBLIC_SITE_OG_IMAGE=/ftv-wordmark-black.png
NEXT_PUBLIC_SITE_FAVICON=/ftv-favicon.ico
NEXT_PUBLIC_SITE_FAVICON_PNG=/ftv-favicon.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=The 2000s in your inbox. Delivered weekly.
NEXT_PUBLIC_SITE_HERO_TAGLINE=The 2000s in your inbox
NEXT_PUBLIC_CONTACT_EMAIL=contact@heebnewsletters.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE=Get From the Vault
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=Join the newsletter for weekly subversive Jewish counter-culture nostalgia from the 2000s—delivered straight to your inbox.
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs

NEXT_PUBLIC_ADS_MODE=cross_promo
# No NEXT_PUBLIC_SHARED_ADS_BRAND — see apps/heebnewsletters/src/config/crossPromoAds.js

NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE
```

## Routes smoke-check

- `/` — latest vault issue + recent archive
- `/article/[slug]` — vault issue detail (editor intro, hero, body, rabbit hole)
- `/archive` — chronological issue list
- `/about` — brand story
- `/profile` — reader profile / subscriptions (requires magic reader token)
