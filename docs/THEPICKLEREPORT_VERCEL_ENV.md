# The Pickle Report — Vercel environment variables (copy/paste)

The Pickle Report is **its own brand**: marketing on `thepicklereport.com`, subscriptions and reader APIs on **`magic.thepicklereport.com`**. It does **not** use Hookup Lists magic (`magic.hookuplists.com`) or Hookup Lists env defaults.

Use this on the **marketing** Vercel project: **Root Directory** = `apps/thepicklereport`.

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

### Marketing (`thepicklereport.com`) — Root Directory `apps/thepicklereport`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://thepicklereport.com` |
| `NEXT_PUBLIC_BRAND_ID` | `thepicklereport` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.thepicklereport.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.thepicklereport.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `3owmesrj` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `The Pickle Report` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Your meta description |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/tpr-photo.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `The world's leading pickle news source. Delivered weekly.` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `The world's leading pickle news source.` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@thepicklereport.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Get The Pickle Report` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Subscribe card blurb |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-2963525366468863` |
| `NEXT_PUBLIC_META_PIXEL_ID` | `809409995127436` |
| `NEXT_PUBLIC_ADSENSE_SLOT_RAIL` | `6426483837` |
| `NEXT_PUBLIC_ADSENSE_SLOT_MID` | `7816554729` |
| `NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM` | `1873962902` |
| `NEXT_PUBLIC_ADSENSE_SLOT_STICKY` | `9051813022` |
| `NEXT_PUBLIC_SHARED_ADS_BRAND` | `thepicklereport` |
| `NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE` | `https://www.the90sparent.com/article/screenanxiety` |
| `NEXT_PUBLIC_SHARED_ADS_URL_STICKY` | `https://www.the90sparent.com/article/birthdayparties` |
| `NEXT_PUBLIC_SHARED_ADS_URL_RAIL` | `https://www.the90sparent.com` |
| `NEXT_PUBLIC_GTM_ID` | Same GTM container as other Unaffiliated sites (view source on the90sparent.com → search `GTM-`) |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | `019a7160-715f-710a-9141-d7af1513ef88` |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

**Do not add to marketing:** `SANITY_API_TOKEN`, `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

### Magic (`magic.thepicklereport.com`) — separate Vercel project

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Generate once: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | `https://thepicklereport.com,https://www.thepicklereport.com,http://localhost:3001` |
| `GCP_PROJECT_ID` | Your GCP project |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for BigQuery/subscribers |

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`thepicklereport.com`)

Copy from the opening ` ```env ` through the closing ` ``` `.

```env
# --- Core site & Pickle magic only ---
NEXT_PUBLIC_SITE_URL=https://thepicklereport.com
NEXT_PUBLIC_BRAND_ID=thepicklereport
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.thepicklereport.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.thepicklereport.com

# --- Sanity ---
NEXT_PUBLIC_SANITY_PROJECT_ID=3owmesrj
NEXT_PUBLIC_SANITY_DATASET=production

# --- Branding & SEO ---
NEXT_PUBLIC_SITE_DISPLAY_NAME=The Pickle Report
NEXT_PUBLIC_SITE_DESCRIPTION=The Wide World of Pickles
NEXT_PUBLIC_SITE_OG_IMAGE=/tpr-photo.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=The world's leading pickle news source. Delivered weekly.
NEXT_PUBLIC_SITE_HERO_TAGLINE=The world's leading pickle news source.
NEXT_PUBLIC_CONTACT_EMAIL=contact@thepicklereport.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE=Get The Pickle Report
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=Join the newsletter for weekly pickle news, trivia, and more—delivered straight to your inbox.
NEXT_PUBLIC_SITE_FAVICON=/favicon.ico
NEXT_PUBLIC_SITE_FAVICON_PNG=/icon.png
NEXT_PUBLIC_SITE_APPLE_ICON=/apple-icon.png
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs

# --- Analytics & verification (⚠️ UPDATE GTM; optional Search Console / Bing) ---
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_SITE_VERIFICATION=
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=019a7160-715f-710a-9141-d7af1513ef88
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE

# --- Ads & pixels ---
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-2963525366468863
NEXT_PUBLIC_META_PIXEL_ID=809409995127436
NEXT_PUBLIC_ADS_MODE=cross_promo
NEXT_PUBLIC_ADSENSE_SLOT_RAIL=6426483837
NEXT_PUBLIC_ADSENSE_SLOT_MID=7816554729
NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM=1873962902
NEXT_PUBLIC_ADSENSE_SLOT_STICKY=9051813022

# --- In-site promos (Pickle creatives → The '90s Parent destinations) ---
NEXT_PUBLIC_SHARED_ADS_BRAND=thepicklereport
NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE=https://www.the90sparent.com/article/screenanxiety
NEXT_PUBLIC_SHARED_ADS_URL_RAIL=https://www.the90sparent.com
NEXT_PUBLIC_SHARED_ADS_URL_STICKY=https://www.the90sparent.com/article/birthdayparties

# --- Subscribe bot protection (⏭️ OPTIONAL) ---
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

### Values you must update (checklist)

| Variable | What to put |
|----------|-------------|
| `NEXT_PUBLIC_SITE_DESCRIPTION` | Your live meta description |
| `NEXT_PUBLIC_GTM_ID` | GTM container ID, e.g. `GTM-ABC1234` |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console HTML-tag token (content only) |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Bing `msvalidate.01` content value |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | OneTrust domain script UUID for **thepicklereport.com** |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | Retention browser snippet site id (not magic server API keys) |
| `NEXT_PUBLIC_SHARED_ADS_*` | Cross-promo click URLs (defaults target the90sparent.com articles) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — Cloudflare Turnstile site key |

Magic URLs in section A should stay on **`magic.thepicklereport.com`** unless you are deliberately changing infrastructure (not Hookup Lists).

### Do not put on the marketing Vercel project

| Variable | Why |
|----------|-----|
| `SANITY_API_TOKEN` | Studio/import scripts only — local or CI secrets |
| `GCP_*`, `READER_TOKEN_SECRET` | **Pickle magic** Vercel project only |
| `RETENTION_API_KEY` / `RETENTION_API_ID` | Magic `/execute` server-side only |

---

## B) Magic Vercel project (`magic.thepicklereport.com`)

Separate Vercel project (same repo path as your other `subscription-functions` / magic deploys, but **its own** env and domain).  
**Not** on the Pickle marketing project. **Not** shared with `magic.hookuplists.com`.

```env
# ⚠️ UPDATE — generate once: openssl rand -hex 32
READER_TOKEN_SECRET=

# ⚠️ UPDATE — Pickle marketing origins only (comma-separated, no trailing slashes)
READERS_CORS_ORIGINS=https://thepicklereport.com,https://www.thepicklereport.com,http://localhost:3001

# BigQuery / execute (⚠️ UPDATE — your Pickle magic service account)
GCP_PROJECT_ID=
GCP_SERVICE_ACCOUNT_KEY=
```

### Magic checklist

| Variable | What to put |
|----------|-------------|
| `READER_TOKEN_SECRET` | New random hex: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | Only origins where users open **thepicklereport.com** (+ `www` if used) and local dev `http://localhost:3001` |
| `GCP_*` | Credentials for Pickle’s BigQuery / subscriber data |

Vote/trivia (`POST /api/vote-response`, `GET /api/reader-trivia-stats`) live on this same magic host once deployed — no extra marketing env vars.

---

## C) Local dev (`apps/thepicklereport/.env.local`)

Copy section A, then override:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3001
```

Keep `NEXT_PUBLIC_MAGIC_*` pointed at `https://magic.thepicklereport.com` (same as production).

---

## D) Related docs

- [THEPICKLEREPORT_LAUNCH_GUIDE.md](./THEPICKLEREPORT_LAUNCH_GUIDE.md) — domains, DNS, smoke tests  
- [ENVIRONMENT.md](./ENVIRONMENT.md) — variable glossary (all apps)  
- [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) — reader token + CORS detail  
