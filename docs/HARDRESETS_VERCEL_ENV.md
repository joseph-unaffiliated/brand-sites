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
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-LNK30D79KJ` (Hard Resets Website web stream) |
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

# --- Marketing tags ---
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-LNK30D79KJ
# NEXT_PUBLIC_GTM_ID=   # set on Vercel (Production + Preview)
# --- Still UPDATE when ready ---
# NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=
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

| Step | Status (2026-07-30) |
|------|---------------------|
| Attach `hardresets.com` (+ `www`) on marketing Vercel project `hardresets` (`prj_boKP42mkO2IvXaNls33ZNBodDSrM`) | ✅ Done — both verified; `www` redirects to apex. DNS already resolving via Cloudflare → Vercel (`https://hardresets.com` 200). |
| Attach `magic.hardresets.com` on `subscription-functions` (`prj_GKhgJdr2maNLxPuOWnmUQXZQRdQO`) | ✅ Already attached + verified (pre-existing). |
| Set `READERS_CORS_ORIGINS` to include Hard Resets origins | ✅ Apex + www were already present; appended `http://localhost:3004`. Shared magic project — do **not** replace the whole list with Hard Resets–only origins. |
| Core marketing env from this doc (site URL, brand id, magic URLs, Sanity `0vm5rx64`, copy, Typekit, ads mode, Retention, GTM `GTM-TVHD6JMG`) | ✅ Set on Production + Preview; redeploy triggered. |
| Provision OneTrust for `hardresets.com` → `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ⏳ **Blocked** — no brand-specific UUID exists. App falls back to network default in `ComplianceScripts.js` until you provision OneTrust and set the env. Do not invent a UUID. |
| Create GA4 property → `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ Done — stream “Hard Resets Website” (`https://hardresets.com`, Stream ID `15355500265`) Measurement ID `G-LNK30D79KJ` set on Production + Preview; redeploy triggered so `NEXT_PUBLIC_*` rebuilds. GA UI may still say data collection isn’t active until first hits arrive. |
| Optional: `NEXT_PUBLIC_META_PIXEL_ID` | ⏳ Not set — create Meta pixel for this brand when ready. |
| Smoke-test subscribe → profile → reader-subscriptions | ⏳ Manual after redeploys finish. |

### Manual next clicks (remaining)

1. **OneTrust:** OneTrust admin → add domain `hardresets.com` → copy Domain Script UUID → Vercel → **hardresets** → Settings → Environment Variables → `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` (Production + Preview) → Redeploy.
2. **GA4:** ✅ Measurement ID `G-LNK30D79KJ` is live on the marketing project (Production + Preview).
3. **Smoke-test:** Open `https://hardresets.com` → subscribe → confirm magic execute → Profile → `GET https://magic.hardresets.com/api/reader-subscriptions` returns 200 with matching `Access-Control-Allow-Origin`.

See also [ENVIRONMENT.md](./ENVIRONMENT.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).
