# Agent / developer rules (`brand-sites` monorepo)

## Layout

- **`apps/<name>/`** — Next.js publication sites only. **Do not** import from sibling `apps/*`.
- **`packages/*`** — shared libraries (`@publication-websites/*`). **Apps may import packages; packages never import apps.**

## Deploy

- **One Vercel project per app**, with **Root Directory** set to `apps/hookuplists`, `apps/thepicklereport`, `apps/thekissandtell`, `apps/the90sparent`, etc.
- **Marketing sites must not** add **BigQuery** or other network DB clients for unauthenticated email lookup. Profile subscriptions load via **Bearer token** from **`magic.*`** (`/api/reader-subscriptions`).

## Env naming

- **`NEXT_PUBLIC_*`** — exposed to the browser; never put secrets here.
- **Secrets** (`GCP_*`, `READER_TOKEN_SECRET`, etc.) — **Vercel env on the magic** (subscription-functions) project, not on marketing apps unless strictly required.

## When adding a new publication

1. Copy an existing app under `apps/` (see `apps/thepicklereport` template).
2. Edit `src/config/site.js` defaults and brand-specific `public/` assets.
3. Create **new** Vercel + Sanity + `magic.*` wiring; set env vars per `docs/ENVIRONMENT.md`.

## Docs to keep updated

When you change deploy topology or auth flows, update **`docs/ARCHITECTURE.md`** and **`docs/DEPLOYMENT.md`**.
