# The Kiss and Tell (site app)

Next.js marketing site for **The Kiss and Tell** publication.

## Local dev

1. From repo root: `pnpm install`
2. `cd apps/thekissandtell` and copy env from your password manager (see `docs/ENVIRONMENT.md` in the monorepo).
3. Point **`NEXT_PUBLIC_MAGIC_*`** at `magic.thekissandtell.com` (or your real magic host).
4. Set **Vercel Root Directory** to `apps/thekissandtell`.

## Brand assets

Default header/footer use a **text wordmark** and **monogram** from `src/config/site.js`. Replace with custom SVG or images in `public/` when ready.
