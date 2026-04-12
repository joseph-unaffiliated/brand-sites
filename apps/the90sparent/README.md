# The '90s Parent (site app)

Next.js marketing site for **The '90s Parent** publication.

## Local dev

1. From repo root: `pnpm install`
2. `cd apps/the90sparent` and copy env from your password manager (see `docs/ENVIRONMENT.md` in the monorepo).
3. Point **`NEXT_PUBLIC_MAGIC_*`** at `magic.the90sparent.com` (or your real magic host).
4. Set **Vercel Root Directory** to `apps/the90sparent`.

## Brand assets

Default header/footer use a **text wordmark** and **monogram** from `src/config/site.js`. Replace with custom SVG or images in `public/` when ready.
