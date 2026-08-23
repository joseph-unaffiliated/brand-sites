# Agent / developer rules (`brand-sites` monorepo)

## Layout

- **`apps/<name>/`** — Next.js publication sites only. **Do not** import from sibling `apps/*`.
- **`packages/*`** — shared libraries (`@publication-websites/*`). **Apps may import packages; packages never import apps.**

## Deploy

- **One Vercel project per app**, with **Root Directory** set to `apps/hookuplists`, `apps/thepicklereport`, `apps/thekissandtell`, `apps/the90sparent`, `apps/theeyeballerscookbook`, `apps/hipspeak`, `apps/heebnewsletters`, `apps/hardresets`, etc.
- Each app `vercel.json` includes **`ignoreCommand`: `npx turbo-ignore --fallback=HEAD^1`** so unrelated monorepo pushes do not rebuild every site. Shared `packages/*` changes still trigger dependent apps.
- **“Build and deploy”** (when asked in chat): run a **production build** for the relevant app (e.g. `pnpm --filter <app> build`), then **commit and push to GitHub** so **Vercel’s Git integration** deploys. Do **not** use `vercel deploy` from the CLI unless the user explicitly asks for that.
- **Marketing sites must not** add **BigQuery** or other network DB clients for unauthenticated email lookup. Profile subscriptions load via **Bearer token** from **`magic.*`** (`/api/reader-subscriptions`).

## Env naming

- **`NEXT_PUBLIC_*`** — exposed to the browser; never put secrets here.
- **Secrets** (`GCP_*`, `READER_TOKEN_SECRET`, etc.) — **Vercel env on the magic** (subscription-functions) project, not on marketing apps unless strictly required.

## When adding a new publication

1. Follow **[`docs/LAUNCH_PLAYBOOK.md`](docs/LAUNCH_PLAYBOOK.md)** (canonical network launch checklist).
2. Copy an existing app under `apps/` (see `apps/thepicklereport` template).
3. Edit `src/config/site.js` defaults and brand-specific `public/` assets.
4. Create **new** Vercel + Sanity + `magic.*` wiring; set env vars per `docs/ENVIRONMENT.md` and the brand `*_VERCEL_ENV.md`.
5. If the brand’s content path is not `/article/`, register it in `packages/shared-ads/brand-paths.js` and keep Airtable Click URL formulas in sync.

## Docs to keep updated

When you change deploy topology or auth flows, update **`docs/ARCHITECTURE.md`** and **`docs/DEPLOYMENT.md`**.

When you add network functionality that new brands need (house ads, comps pages, path map, quiz patterns, compliance, etc.), update **`docs/LAUNCH_PLAYBOOK.md` in the same PR**.
