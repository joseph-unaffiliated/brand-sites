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
| `NEXT_PUBLIC_SITE_URL` | `https://www.hardresets.com` (preferred host; apex 308 → www) |
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
| `NEXT_PUBLIC_META_PIXEL_ID` | `809409995127436` (network Meta pixel, same as Pickle / Parent) |
| `NEXT_PUBLIC_GTM_ID` | Same GTM container as other Unaffiliated sites |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-LNK30D79KJ` (Hard Resets Website web stream) |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | `019a7160-3984-781b-95d0-f07cf83e7e37` |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | `czv-_WEhfW3Syo2EqhEfAMjrylIYTqZ9crDm1FU8qBY` (matches DNS TXT on apex) |
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
NEXT_PUBLIC_SITE_URL=https://www.hardresets.com
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
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=019a7160-3984-781b-95d0-f07cf83e7e37
NEXT_PUBLIC_META_PIXEL_ID=809409995127436
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=czv-_WEhfW3Syo2EqhEfAMjrylIYTqZ9crDm1FU8qBY
# NEXT_PUBLIC_GTM_ID=   # set on Vercel (Production + Preview)
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
| Attach `hardresets.com` (+ `www`) on marketing Vercel project `hardresets` (`prj_boKP42mkO2IvXaNls33ZNBodDSrM`) | ✅ Done — both verified on Vercel; apex **308 → `www.hardresets.com`**. **2026-07-30 cutover:** removed Cloudflare `webflow-proxy` routes on apex/`www` (were serving Webflow `unaffiliated.co` via dummy `A 192.0.2.1`). Apex + `www` now **CNAME → `238337c3951251d0.vercel-dns-016.com`** (DNS-only, same pattern as `magic.hardresets.com`). Confirmed Next.js + `G-LNK30D79KJ`. MX/email untouched. |
| Attach `magic.hardresets.com` on `subscription-functions` (`prj_GKhgJdr2maNLxPuOWnmUQXZQRdQO`) | ✅ Already attached + verified (pre-existing). |
| Set `READERS_CORS_ORIGINS` to include Hard Resets origins | ✅ Apex + www were already present; appended `http://localhost:3004`. Shared magic project — do **not** replace the whole list with Hard Resets–only origins. |
| Core marketing env from this doc (site URL, brand id, magic URLs, Sanity `0vm5rx64`, copy, Typekit, ads mode, Retention, GTM `GTM-TVHD6JMG`) | ✅ Set on Production + Preview; redeploy triggered. |
| Provision OneTrust for `hardresets.com` → `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ✅ `019a7160-3984-781b-95d0-f07cf83e7e37` |
| Create GA4 property → `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ Done — stream “Hard Resets Website” (`https://hardresets.com`, Stream ID `15355500265`) Measurement ID `G-LNK30D79KJ` set on Production + Preview. |
| `NEXT_PUBLIC_META_PIXEL_ID` | ✅ Network pixel `809409995127436` |
| `NEXT_PUBLIC_SITE_URL` preferred host | ✅ `https://www.hardresets.com` (canonical / sitemap / OG) |
| Smoke-test subscribe → profile → reader-subscriptions | ✅ 2026-07-30 — CORS OK (www + apex); `/execute` subscribe 200 + readerToken; `subscribedBrands: ["hardresets"]`; `/profile` 200 |
| GTM vs GA4 double-count | ✅ Published `GTM-TVHD6JMG` contains **no** `G-*` measurement IDs (no `G-LNK30D79KJ`); direct gtag alone fires Hard Resets GA4 |
| Search Console | ✅ DNS TXT already on apex (`google-site-verification=czv-_…`); meta env set to same token for HTML tag |

### Manual next clicks (remaining)

1. In Google Search Console, confirm a **Domain** property for `hardresets.com` (DNS already verifies) or URL-prefix `https://www.hardresets.com/` — submit sitemap `https://www.hardresets.com/sitemap.xml` if not already.
2. Optional: clean up the smoke-test address `joseph+hr-smoke-*@unaffiliated.co` in Customer.io if you don’t want it kept.

See also [ENVIRONMENT.md](./ENVIRONMENT.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).
