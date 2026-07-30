# Hard Resets — Vercel environment variables (copy/paste)

Hard Resets is **its own brand**: marketing on `hardresets.com`, subscriptions and reader APIs on **`magic.hardresets.com`**. It does **not** share magic hosts or env defaults with any other brand.

Use this on the **marketing** Vercel project: **Root Directory** = `apps/hardresets`.

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

### Marketing (`hardresets.com`) — Root Directory `apps/hardresets`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://hardresets.com` |
| `NEXT_PUBLIC_BRAND_ID` | `hardresets` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.hardresets.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.hardresets.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `0vm5rx64` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `Hard Resets` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `Stories of endings and beginnings. The many ways people blow up their lives.` |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/hr-phone.png` |
| `NEXT_PUBLIC_SITE_FAVICON` | `/hr-webclip.png` |
| `NEXT_PUBLIC_SITE_FAVICON_PNG` | `/hr-webclip.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `Stories of Endings and Beginnings` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `The many ways people blow up their lives` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@hardresets.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Add Hard Resets to Your Inbox` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Weekly profiles of hard resets—people who blew up their lives and built something new. |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` (slot → brand map is in `apps/hardresets/src/config/crossPromoAds.js` — Pickle + The ’90s Parent) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ UPDATE — Meta pixel for this brand |
| `NEXT_PUBLIC_GTM_ID` | Same GTM container as other Unaffiliated sites |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⚠️ UPDATE — create a new GA4 property for this brand |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ⚠️ UPDATE — OneTrust domain script UUID for **hardresets.com** |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

**Do not add to marketing:** `SANITY_API_TOKEN`, `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

### Magic (`magic.hardresets.com`) — separate Vercel project

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Generate once: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | `https://hardresets.com,https://www.hardresets.com,http://localhost:3004` |
| `GCP_PROJECT_ID` | Your GCP project |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for BigQuery/subscribers |

The brand also needs entries in the **subscription-functions** repo — follow `subscription-functions-copy/docs/ADDING_A_NEW_BRAND.md` with brand id `hardresets`.

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`hardresets.com`)

```env
# --- Core site & Hard Resets magic only ---
NEXT_PUBLIC_SITE_URL=https://hardresets.com
NEXT_PUBLIC_BRAND_ID=hardresets
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.hardresets.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.hardresets.com
NEXT_PUBLIC_SANITY_PROJECT_ID=0vm5rx64
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_DISPLAY_NAME=Hard Resets
NEXT_PUBLIC_SITE_DESCRIPTION=Stories of endings and beginnings. The many ways people blow up their lives.
NEXT_PUBLIC_SITE_OG_IMAGE=/hr-phone.png
NEXT_PUBLIC_SITE_FAVICON=/hr-webclip.png
NEXT_PUBLIC_SITE_FAVICON_PNG=/hr-webclip.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=Stories of Endings and Beginnings
NEXT_PUBLIC_SITE_HERO_TAGLINE=The many ways people blow up their lives
NEXT_PUBLIC_CONTACT_EMAIL=contact@hardresets.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE=Add Hard Resets to Your Inbox
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=Weekly profiles of hard resets—people who blew up their lives and built something new. Delivered to your inbox.
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs
NEXT_PUBLIC_ADS_MODE=cross_promo
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE

# --- UPDATE before launch ---
# NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=
# NEXT_PUBLIC_GA_MEASUREMENT_ID=
# NEXT_PUBLIC_GTM_ID=
# NEXT_PUBLIC_META_PIXEL_ID=
```

## B) Magic (`magic.hardresets.com`)

```env
READER_TOKEN_SECRET=
READERS_CORS_ORIGINS=https://hardresets.com,https://www.hardresets.com,http://localhost:3004
GCP_PROJECT_ID=
GCP_SERVICE_ACCOUNT_KEY=
```

## Go-live checklist

1. Attach `hardresets.com` (+ `www`) on the marketing Vercel project.
2. Attach `magic.hardresets.com` on the magic Vercel project; set CORS as above.
3. Provision OneTrust for `hardresets.com` and set `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT`.
4. Create GA4 property; set `NEXT_PUBLIC_GA_MEASUREMENT_ID`.
5. Redeploy marketing + magic; smoke-test subscribe → profile → reader-subscriptions.

See also [ENVIRONMENT.md](./ENVIRONMENT.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).
