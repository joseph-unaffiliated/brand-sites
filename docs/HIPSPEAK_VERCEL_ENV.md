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
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` (static fallback in `crossPromoAds.js`; Airtable house ads take priority when configured) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ UPDATE — set on Vercel (network or brand pixel) |
| `NEXT_PUBLIC_GTM_ID` | ⚠️ UPDATE — same GTM container as other Unaffiliated sites when ready |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⚠️ UPDATE — Hipspeak GA4 web stream when ready |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | `019a7167-e6eb-7fa2-ae9f-60338480c772` ✅ (also baked into `ComplianceScripts.js`) |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `AIRTABLE_HOUSE_ADS_BASE_ID` | `appXFQv3Hy0wUDDnb` — house-ads pool (`/api/house-ads`) |
| `AIRTABLE_HOUSE_ADS_TABLE_ID` | `tblB3emRodWIzabTP` |
| `AIRTABLE_API_KEY` | ⚠️ UPDATE — **server-only.** Token from Keys — do not commit. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

**Do not add to marketing:** `SANITY_API_TOKEN`, `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

House ads rotate **other** brands onto Hipspeak via Airtable Destination Brands (never self-promo). Static `crossPromoAds.js` is fallback only.

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

# Set on Vercel when ready (Meta / GTM / GA4)
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=019a7167-e6eb-7fa2-ae9f-60338480c772
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE

# House ads (server-only — do not prefix NEXT_PUBLIC_)
# AIRTABLE_HOUSE_ADS_BASE_ID=appXFQv3Hy0wUDDnb
# AIRTABLE_HOUSE_ADS_TABLE_ID=tblB3emRodWIzabTP
# AIRTABLE_API_KEY=
```

## Routes smoke-check

- `/` — latest slang entry (“word of the week”)
- `/word/coded` — Coded sample entry
- `/archive` — chronological word list
- `/my-words` — client-side favorites
- `/quiz` — slang knowledge quiz (subscribe to see results)
- `/pollresults/coded?poll=a` — pop quiz results
- `/opted-out-comps` / `/opted-in-comps` — compilations preference confirmation
- `/ai-policy` — AI policy

---

## Go-live cutover (manual)

Full checklist: [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md#hipspeak-go-live-manual-cutover).

1. **Airtable** — Add Hipspeak to Destination Brands; brand-aware Click URL (`/word/{slug}`).
2. **Vercel marketing** — Env above; attach `hipspeak.com` / `www`; production green.
3. **Magic** — CORS + deploy with branded comps; `reader-health` OK.
4. **Cloudflare** — Disable webflow-proxy worker routes; CNAME to Vercel DNS-only; SSL Full (strict).
5. **Smoke** — home, `/word/…`, subscribe, profile, `/quiz`, house ad, comps.
