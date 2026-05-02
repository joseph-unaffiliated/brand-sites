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
| `NEXT_PUBLIC_SHARED_ADS_BRAND` | yes | When set (e.g. `the90sparent`), Pickle Report uses image creatives from `packages/shared-ads/<brand>/` instead of the default Hookup Lists text card. Omit on sites that should not load that set. |
| `NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE` | yes | Destination URL for shared image ads in **rectangle** slots (mid + bottom in-article). Falls back to `NEXT_PUBLIC_CROSS_PROMO_URL`. |
| `NEXT_PUBLIC_SHARED_ADS_URL_RAIL` | yes | Destination URL for the **rail** (sidebar) shared image ad. Falls back to `NEXT_PUBLIC_CROSS_PROMO_URL`. |
| `NEXT_PUBLIC_SHARED_ADS_URL_STICKY` | yes | Destination URL for the **sticky footer** shared image ad (desktop + mobile creatives). Falls back to `NEXT_PUBLIC_CROSS_PROMO_URL`. |
| `NEXT_PUBLIC_CROSS_PROMO_URL` | yes | Default external URL for cross-promo links when placement-specific URLs are unset (default `https://hookuplists.com`). Also used by the text Hookup Lists card. |
| `NEXT_PUBLIC_CROSS_PROMO_HEADLINE` | yes | Card title. |
| `NEXT_PUBLIC_CROSS_PROMO_DESCRIPTION` | yes | Short body text. |
| `NEXT_PUBLIC_CROSS_PROMO_BRAND_LABEL` | yes | Small brand line (e.g. `Hookup Lists`). |
| `NEXT_PUBLIC_CROSS_PROMO_LOGO_PATH` | yes | Path under `public/` (default `/cross-promo-hl.svg`). |
| `NEXT_PUBLIC_CROSS_PROMO_CTA` | yes | CTA label (default `Read the story`). |
| `NEXT_PUBLIC_META_PIXEL_ID` | yes | Meta Pixel. |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | yes | Site title / OG name. |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | yes | Meta description. |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | yes | Path to OG image (default `/hl-photo.png`). |
| `NEXT_PUBLIC_SITE_FAVICON` | yes | Primary favicon path under `public/` (often `.ico`; The ’90s Parent default `/tnp-favicon.ico`). |
| `NEXT_PUBLIC_SITE_FAVICON_PNG` | yes | PNG favicon for `metadata.icons` (The ’90s Parent default `/tnp-favicon.png`; other apps may ignore until they add a second icon in layout). |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | yes | Adobe Fonts kit (optional per brand). |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | yes | Optional Google Search Console site-verification token. Renders `<meta name="google-site-verification">`. |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | yes | Optional Bing Webmaster Tools site-verification token. Renders `<meta name="msvalidate.01">`. |
| `NEXT_PUBLIC_GTM_ID` | yes | Optional Google Tag Manager container id (e.g. `GTM-XXXX`). Injects the standard GTM script in the document head and the noscript iframe at the top of `<body>`. |

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
