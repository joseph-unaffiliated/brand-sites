# The Eyeballer's Cookbook — Vercel environment variables (copy/paste)

The Eyeballer's Cookbook is **its own brand**: marketing on `theeyeballerscookbook.com`, subscriptions and reader APIs on **`magic.theeyeballerscookbook.com`**. It does **not** share magic hosts or env defaults with any other brand.

Use this on the **marketing** Vercel project: **Root Directory** = `apps/theeyeballerscookbook`.

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

### Marketing (`theeyeballerscookbook.com`) — Root Directory `apps/theeyeballerscookbook`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://theeyeballerscookbook.com` |
| `NEXT_PUBLIC_BRAND_ID` | `theeyeballerscookbook` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.theeyeballerscookbook.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.theeyeballerscookbook.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `89sdxpbh` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `The Eyeballer's Cookbook` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `Recipes without measurements. One simple, eyeballed recipe a week, delivered to your inbox.` |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/tec-photo.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `Recipes without measurements. Delivered weekly.` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `Recipes Without Measurements` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@theeyeballerscookbook.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Get The Eyeballer's Cookbook` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Subscribe card blurb |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` (slot → brand map is in `apps/theeyeballerscookbook/src/config/crossPromoAds.js` — Pickle + '90s Parent only) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ UPDATE — new Meta pixel for this brand |
| `NEXT_PUBLIC_GTM_ID` | Same GTM container as other Unaffiliated sites |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-L5VEGPHYGS` ✅ |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | `019a7167-a517-7d06-9a67-bb514569a46d` ✅ |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `AIRTABLE_HOUSE_ADS_BASE_ID` | `appXFQv3Hy0wUDDnb` — house-ads Airtable pool (`/api/house-ads`), checked before `crossPromoAds.js`'s static creative |
| `AIRTABLE_HOUSE_ADS_TABLE_ID` | `tblB3emRodWIzabTP` |
| `AIRTABLE_API_KEY` | ⚠️ UPDATE — **server-only, no `NEXT_PUBLIC_` prefix.** Token from `Keys/AIRTABLE_ACCESS_TOKEN.txt` — do not commit it. See [`packages/shared-ads/README.md`](../packages/shared-ads/README.md#house-ads-airtable-pool). |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

**Do not add to marketing:** `SANITY_API_TOKEN`, `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

### Magic (`magic.theeyeballerscookbook.com`) — separate Vercel project

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Generate once: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | `https://theeyeballerscookbook.com,https://www.theeyeballerscookbook.com,http://localhost:3005` |
| `GCP_PROJECT_ID` | Your GCP project |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for BigQuery/subscribers |

The brand also needs entries in the **subscription-functions** repo — follow `subscription-functions-copy/docs/ADDING_A_NEW_BRAND.md` with brand id `theeyeballerscookbook`.

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`theeyeballerscookbook.com`)

Copy from the opening ` ```env ` through the closing ` ``` `.

```env
# --- Core site & Eyeballer's magic only ---
NEXT_PUBLIC_SITE_URL=https://theeyeballerscookbook.com
NEXT_PUBLIC_BRAND_ID=theeyeballerscookbook
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.theeyeballerscookbook.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.theeyeballerscookbook.com

# --- Sanity ---
NEXT_PUBLIC_SANITY_PROJECT_ID=89sdxpbh
NEXT_PUBLIC_SANITY_DATASET=production

# --- Branding & SEO ---
NEXT_PUBLIC_SITE_DISPLAY_NAME=The Eyeballer's Cookbook
NEXT_PUBLIC_SITE_DESCRIPTION=Recipes without measurements. One simple, eyeballed recipe a week, delivered to your inbox.
NEXT_PUBLIC_SITE_OG_IMAGE=/tec-photo.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=Recipes without measurements. Delivered weekly.
NEXT_PUBLIC_SITE_HERO_TAGLINE=Recipes Without Measurements
NEXT_PUBLIC_CONTACT_EMAIL=contact@theeyeballerscookbook.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE=Get The Eyeballer's Cookbook
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=Join the newsletter for one relaxed, no-measuring-cups recipe a week—delivered straight to your inbox.
NEXT_PUBLIC_SITE_FAVICON=/tec-favicon.ico
NEXT_PUBLIC_SITE_FAVICON_PNG=/tec-favicon.png
NEXT_PUBLIC_SITE_APPLE_ICON=/apple-icon.png
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs

# --- Analytics & verification (⚠️ UPDATE GTM if needed; optional Search Console / Bing) ---
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-L5VEGPHYGS
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_BING_SITE_VERIFICATION=
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=019a7167-a517-7d06-9a67-bb514569a46d
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE

# --- Ads & pixels (⚠️ UPDATE pixel; AdSense optional under cross_promo) ---
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_ADS_MODE=cross_promo
# Do NOT set NEXT_PUBLIC_SHARED_ADS_BRAND for this app — the static cross-promo
# fallback is chosen per slot in src/config/crossPromoAds.js (never self-promo).

# --- House ads (Airtable pool, checked before crossPromoAds.js's static creative) ---
AIRTABLE_HOUSE_ADS_BASE_ID=appXFQv3Hy0wUDDnb
AIRTABLE_HOUSE_ADS_TABLE_ID=tblB3emRodWIzabTP
# ⚠️ UPDATE — server-only secret, do NOT prefix NEXT_PUBLIC_. Value from Keys/AIRTABLE_ACCESS_TOKEN.txt (never commit it).
AIRTABLE_API_KEY=

# --- Subscribe bot protection (⏭️ OPTIONAL) ---
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# --- Reader profile / favorites sync (⏭️ OPTIONAL until reader-platform is live) ---
# NEXT_PUBLIC_READER_EVENTS_ENABLED=true
# NEXT_PUBLIC_READER_PROFILE_V2=true
```

### Values you must update (checklist)

| Variable | What to put |
|----------|-------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `89sdxpbh` (already created) |
| `NEXT_PUBLIC_GTM_ID` | GTM container ID, e.g. `GTM-ABC1234` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-L5VEGPHYGS` (repo default) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Shared network Meta pixel (or brand-specific if split later) |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | `019a7167-a517-7d06-9a67-bb514569a46d` (repo default) |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | Retention browser snippet site id (not magic server API keys) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — Cloudflare Turnstile site key |

Magic URLs in section A should stay on **`magic.theeyeballerscookbook.com`** unless you are deliberately changing infrastructure.

### Do not put on the marketing Vercel project

| Variable | Why |
|----------|-----|
| `SANITY_API_TOKEN` | Studio/import scripts only — local or CI secrets |
| `GCP_*`, `READER_TOKEN_SECRET` | **Eyeballer's magic** Vercel project only |
| `RETENTION_API_KEY` / `RETENTION_API_ID` | Magic `/execute` server-side only |

---

## B) Magic Vercel project (`magic.theeyeballerscookbook.com`)

Separate Vercel project (same repo path as your other `subscription-functions` / magic deploys, but **its own** env and domain). Requires the `theeyeballerscookbook` brand entries in the subscription-functions repo first (`ADDING_A_NEW_BRAND.md`).

```env
# ⚠️ UPDATE — generate once: openssl rand -hex 32
READER_TOKEN_SECRET=

# ⚠️ UPDATE — Eyeballer's marketing origins only (comma-separated, no trailing slashes)
READERS_CORS_ORIGINS=https://theeyeballerscookbook.com,https://www.theeyeballerscookbook.com,http://localhost:3005

# BigQuery / execute (⚠️ UPDATE — your magic service account)
GCP_PROJECT_ID=
GCP_SERVICE_ACCOUNT_KEY=
```

### Magic checklist

| Variable | What to put |
|----------|-------------|
| `READER_TOKEN_SECRET` | New random hex: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | Only origins where users open **theeyeballerscookbook.com** (+ `www` if used) and local dev `http://localhost:3005` |
| `GCP_*` | Credentials for the brand's BigQuery / subscriber data |

---

## C) Local dev (`apps/theeyeballerscookbook/.env.local`)

Copy section A, then override:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3005
```

Keep `NEXT_PUBLIC_MAGIC_*` pointed at `https://magic.theeyeballerscookbook.com` (same as production). Dev server: `pnpm --filter theeyeballerscookbook dev` (port 3005).

---

## D) Related docs

- [ENVIRONMENT.md](./ENVIRONMENT.md) — variable glossary (all apps)
- [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) — reader token + CORS detail
- `studio-the-eyeballers-cookbook/README.md` — Sanity project creation + studio deploy
