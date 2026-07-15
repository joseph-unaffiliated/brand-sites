# Hipspeak — Vercel environment variables (copy/paste)

Hipspeak is **its own brand**: marketing on `hipspeak.com`, subscriptions and reader APIs on **`magic.hipspeak.com`**. It does **not** share magic hosts or env defaults with any other brand.

Use this on the **marketing** Vercel project: **Root Directory** = `apps/hipspeak`.

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

### Marketing (`hipspeak.com`) — Root Directory `apps/hipspeak`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://hipspeak.com` |
| `NEXT_PUBLIC_BRAND_ID` | `hipspeak` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.hipspeak.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.hipspeak.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `idpyzq1z` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `Hipspeak` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `The Dictionary of Slang. One word a week, decoded.` |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/hip-photo.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `The Dictionary of Slang. Delivered weekly.` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `The Dictionary of Slang` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@hipspeak.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Get Hipspeak` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Subscribe card blurb |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` (slot → brand map is in `apps/hipspeak/src/config/crossPromoAds.js` — Pickle + '90s Parent only; never Hipspeak) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ UPDATE — new Meta pixel for this brand |
| `NEXT_PUBLIC_GTM_ID` | Same GTM container as other Unaffiliated sites |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⚠️ UPDATE — create a new GA4 property for this brand |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ⚠️ UPDATE — OneTrust domain script UUID for **hipspeak.com** |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

**Do not add to marketing:** `SANITY_API_TOKEN`, `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

**Do not set** `NEXT_PUBLIC_SHARED_ADS_BRAND=hipspeak` — house ads rotate other brands via `crossPromoAds.js`.

### Magic (`magic.hipspeak.com`) — separate Vercel project

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Generate once: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | `https://hipspeak.com,https://www.hipspeak.com,http://localhost:3006` |
| `GCP_PROJECT_ID` | Your GCP project |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for BigQuery/subscribers |

The brand also needs entries in the **subscription-functions** repo — follow `subscription-functions-copy/docs/ADDING_A_NEW_BRAND.md` with brand id `hipspeak`.

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`hipspeak.com`)

```env
# --- Core site & Hipspeak magic only ---
NEXT_PUBLIC_SITE_URL=https://hipspeak.com
NEXT_PUBLIC_BRAND_ID=hipspeak
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.hipspeak.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.hipspeak.com

NEXT_PUBLIC_SANITY_PROJECT_ID=idpyzq1z
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=Hipspeak
NEXT_PUBLIC_SITE_DESCRIPTION=The Dictionary of Slang. One word a week, decoded.
NEXT_PUBLIC_SITE_OG_IMAGE=/hip-photo.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=The Dictionary of Slang. Delivered weekly.
NEXT_PUBLIC_SITE_HERO_TAGLINE=The Dictionary of Slang
NEXT_PUBLIC_CONTACT_EMAIL=contact@hipspeak.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE=Get Hipspeak
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=One word a week — decoded for humans who don't want to cringe.
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs

NEXT_PUBLIC_ADS_MODE=cross_promo
# No NEXT_PUBLIC_SHARED_ADS_BRAND — see apps/hipspeak/src/config/crossPromoAds.js

NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE
```

## Routes smoke-check

- `/` — latest slang entry (“word of the week”)
- `/word/coded` — Coded sample entry
- `/archive` — chronological word list
- `/my-words` — client-side favorites
- `/pollresults/coded?poll=a` — pop quiz results
