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
