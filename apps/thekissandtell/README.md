# The Kiss and Tell (site app)

Next.js marketing site for **The Kiss and Tell** — dating stories in a Hookup Lists–style entries layout, with TKAT purple/magenta branding.

## Local dev

1. From repo root: `pnpm install`
2. `cd apps/thekissandtell` and copy env from your password manager (see `docs/ENVIRONMENT.md` in the monorepo).
3. Point **`NEXT_PUBLIC_MAGIC_*`** at `magic.thekissandtell.com` (or your real magic host).
4. Set **`NEXT_PUBLIC_SANITY_PROJECT_ID`** to `16jtlwpq` (shared with Hookup Lists) and dataset `production` if unset.
5. Set **Vercel Root Directory** to `apps/thekissandtell`.

## Brand assets

PNG wordmarks, gradient K mark, phone OG image, and favicons live in `public/` (`tkat-*`). Header/footer use `BrandWordmark` and `BrandLogoMark` in `src/components/`.

## Sanity

Article schema matches Hookup Lists: `article` documents with `entries[]` (`age`, `title`, `body`). Run the Sanity Studio from this app or use the shared project studio.
