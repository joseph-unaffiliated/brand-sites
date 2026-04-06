# Environment variables

## Marketing app (`apps/hookuplists`, `apps/thepicklereport`, …)

| Variable | Browser? | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical site URL (OG, metadata). |
| `NEXT_PUBLIC_BRAND_ID` | yes | Slug sent to `/execute` (e.g. `hookuplists`). |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | yes | Full URL to POST (`https://magic….com/execute`). |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | optional | Magic **origin** for profile API (defaults from execute URL). |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | yes | Sanity project. |
| `NEXT_PUBLIC_SANITY_DATASET` | yes | Usually `production`. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | yes | AdSense client id. |
| `NEXT_PUBLIC_ADSENSE_SLOT_*` | yes | Slot ids for ad units (if used). |
| `NEXT_PUBLIC_ADS_MODE` | yes | `cross_promo` (default in app when unset) or `adsense` for Google AdSense slots. |
| `NEXT_PUBLIC_CROSS_PROMO_URL` | yes | External URL for the cross-promo card (default `https://hookuplists.com`). |
| `NEXT_PUBLIC_CROSS_PROMO_HEADLINE` | yes | Card title. |
| `NEXT_PUBLIC_CROSS_PROMO_DESCRIPTION` | yes | Short body text. |
| `NEXT_PUBLIC_CROSS_PROMO_BRAND_LABEL` | yes | Small brand line (e.g. `Hookup Lists`). |
| `NEXT_PUBLIC_CROSS_PROMO_LOGO_PATH` | yes | Path under `public/` (default `/cross-promo-hl.svg`). |
| `NEXT_PUBLIC_CROSS_PROMO_CTA` | yes | CTA label (default `Read the story`). |
| `NEXT_PUBLIC_META_PIXEL_ID` | yes | Meta Pixel. |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | yes | Site title / OG name. |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | yes | Meta description. |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | yes | Path to OG image (default `/hl-photo.png`). |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | yes | Adobe Fonts kit (optional per brand). |

**Do not** set `GCP_*` on marketing apps for reader profile; removed BigQuery route.

## Magic deploy (`subscription-functions-copy` on Vercel)

| Variable | Secret? | Purpose |
|----------|---------|---------|
| `GCP_PROJECT_ID` | — | BigQuery project. |
| `GCP_SERVICE_ACCOUNT_KEY` | **yes** | JSON or base64 service account. |
| `READER_TOKEN_SECRET` | **yes** | HMAC secret for `readerToken` + `/api/reader-subscriptions`. |
| `READERS_CORS_ORIGINS` | — | Comma-separated **origins** (no trailing slash). See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for examples. |

## Sanity Studio (`studio-hookup-lists/`)

| Variable | Purpose |
|----------|---------|
| `SANITY_STUDIO_PROJECT_ID` | Prefer over committing project id. |
| `SANITY_STUDIO_DATASET` | Optional override. |
| `NEXT_PUBLIC_SANITY_*` | Fallback for local dev. |
