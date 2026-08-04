# `shared-ads`

Shared image creatives for cross-promo placements across marketing sites.

## Layout

- One folder per **advertiser** (e.g. `the90sparent/`), not per host site—so The Pickle Report can point at `the90sparent` without loading “pickle” ads on The Pickle Report.
- Register each set in `index.js` as `sharedAdSets.<folderName>`.

## Conventions (per advertiser folder)

Typical assets (names are examples; wire them in `index.js`):

- **In-article / rectangle slots** — e.g. `tnp-inarticlead.png` (e.g. 300×250)
- **Rail (desktop only in TPR layout)** — e.g. `tnp-railad.png` (e.g. 160×600); host CSS should hide the rail on small viewports
- **Sticky footer** — desktop + mobile PNGs (e.g. 320×50 and 728×90)

## Host app

Set `NEXT_PUBLIC_SHARED_ADS_BRAND` to the folder key (e.g. `the90sparent`). Optionally set `NEXT_PUBLIC_SHARED_ADS_URL_IN_ARTICLE`, `NEXT_PUBLIC_SHARED_ADS_URL_RAIL`, and `NEXT_PUBLIC_SHARED_ADS_URL_STICKY` for per-placement links; any omitted value falls back to `NEXT_PUBLIC_CROSS_PROMO_URL`. See `docs/ENVIRONMENT.md`.

## House ads (Airtable pool)

`house-ads.js` (exported as `@publication-websites/shared-ads/house-ads`) is a second,
dynamic pool of cross-promo creatives sourced from an Airtable base instead of files in
this package. Each of the four network brand sites (The '90s Parent, The Pickle Report,
Hard Resets, The Eyeballer's Cookbook) calls this from a server-side `/api/house-ads`
route, which is fetched client-side by `HouseAdPool` and rendered by `HouseAdImage` in
each app (`apps/<brand>/src/components/`). A house ad always takes priority over the
static per-app creative above; the static creative is only shown as a fallback when
Airtable is empty/unconfigured or has no eligible creative for that slot + reader.

### Base

- **Base:** `appXFQv3Hy0wUDDnb`
- **Table:** Creatives (`tblB3emRodWIzabTP`)
- Both are baked in as defaults in `house-ads.js` (`HOUSE_ADS_BASE_ID_DEFAULT` /
  `HOUSE_ADS_TABLE_ID_DEFAULT`) and can be overridden per-environment via
  `AIRTABLE_HOUSE_ADS_BASE_ID` / `AIRTABLE_HOUSE_ADS_TABLE_ID`.

### Table schema (Creatives)

| Field | Type | Notes |
|-------|------|-------|
| `Name` | Single line text | Internal label only, not rendered. |
| `Brand` / `Brand Key` | Link + lookup | Advertiser brand for house ads (`Brand Key` slug). Commerce Ads may omit Brand (treated as `commerce`). |
| `Destination Brands` | Link to All Brands | Host sites allowed to show this creative. Empty = all hosts. Required in practice for Commerce Ads targeting. |
| `Slot` | Single select | One of `inArticle`, `rail`, `stickyDesktop`, `stickyMobile`. Sticky ads need **both** a `stickyDesktop` and a `stickyMobile` row for the same `Brand key` — an unpaired sticky creative is skipped. |
| `Image` | Attachment | Upload the creative image here; the first attachment's URL is used. |
| `Click URL` | URL | Destination when the ad is clicked. Amazon product URLs are auto-tagged with the site Associates ID at render time. |
| `Ad type` | Single select | `House Ads` (cross-promo network) or `Commerce Ads` (Amazon/affiliate commerce). Existing rows defaulted to `House Ads`. Tracked as `house_ad` / `commerce_ad` in ad events. |
| `Active` | Checkbox | Only checked rows are eligible. |
| `Jewish-interested` | Checkbox | See "Jewish-interested flag" below. |
| `Weight` | Number | Optional; defaults to `1`. Higher weight = picked more often (weighted random) among eligible creatives for a slot. |

### Uploading a new creative

1. Open the base ([airtable.com/appXFQv3Hy0wUDDnb](https://airtable.com/appXFQv3Hy0wUDDnb)) → **Creatives** table.
2. Add a row: set `Brand` (advertiser) for House Ads, set `Destination Brands` to the host
   sites that may show it, `Slot` to the placement
   (`inArticle` / `rail`, or both `stickyDesktop` + `stickyMobile` rows for a sticky pair),
   attach the `Image`, set `Click URL` / slug fields as needed, and check `Active`.
3. Set `Ad type` to `House Ads` or `Commerce Ads`. Set `Jewish-interested` if the creative should be flagged as Jewish-interest content
   (see below). Optionally set `Weight` to bias selection.
4. No redeploy needed — the `/api/house-ads` route revalidates every 10 minutes
   (`revalidate: 600`), so new/edited rows appear within ~10 minutes.

### Env vars

| Variable | Where | Purpose |
|----------|-------|---------|
| `AIRTABLE_API_KEY` | Each brand's marketing Vercel project (server-only, **not** `NEXT_PUBLIC_*`) | Airtable personal access token with read access to the base above. Get the value from `Keys/AIRTABLE_ACCESS_TOKEN.txt` (do not commit it). `AIRTABLE_ACCESS_TOKEN` is also accepted as a fallback name. |
| `AIRTABLE_HOUSE_ADS_BASE_ID` | Optional override | Defaults to `appXFQv3Hy0wUDDnb`. |
| `AIRTABLE_HOUSE_ADS_TABLE_ID` | Optional override | Defaults to `tblB3emRodWIzabTP`. |

When `AIRTABLE_API_KEY` (or `AIRTABLE_ACCESS_TOKEN`) is unset, `/api/house-ads` returns
`{ ad: null }` immediately (no Airtable call) and every app silently falls back to its
static `shared-ads` creative — safe to leave unset in local dev.

### Jewish-interested flag

Some house-ad advertisers (e.g. `heebnewsletters`) are relevant primarily to readers
interested in Jewish content. The `Jewish-interested` checkbox on a creative flows
through `selectHouseAd()` as `isJewishContent` and is attached to that ad's
`ad_impression` / `ad_click` tracking events (`trackAdClick` / `useAdImpression` props in
`HouseAdImage`) alongside `creativeBrand`, so downstream analytics can segment or
suppress Jewish-interest house ads without needing a second Airtable field per brand.
