# The '90s Parent (site app)

Next.js marketing site for **The '90s Parent** publication.

## Local dev

1. From repo root: `pnpm install`
2. `cd apps/the90sparent` and copy env from your password manager (see `docs/ENVIRONMENT.md` in the monorepo).
3. Point **`NEXT_PUBLIC_MAGIC_*`** at `magic.the90sparent.com` (or your real magic host).
4. Set **Vercel Root Directory** to `apps/the90sparent`.

## Brand assets

Header/footer use inline SVG in `BrandWordmark.js` and `BrandLogoMark.js` (sourced from `public/tnp-wordmark.svg` and `public/tnp-logo.svg`; paths use `currentColor` so they follow theme text color). Replace those SVGs when the brand updates.

Metadata defaults (`layout.js`): favicons `/tnp-favicon.ico` and `/tnp-favicon.png` (both in `public/`), Apple touch icon `/tnp-webclip.png`, OG/social preview `/tnp-photo.gif`. Override with `NEXT_PUBLIC_SITE_FAVICON`, `NEXT_PUBLIC_SITE_FAVICON_PNG`, `NEXT_PUBLIC_SITE_APPLE_ICON`, `NEXT_PUBLIC_SITE_OG_IMAGE` on Vercel if needed.
