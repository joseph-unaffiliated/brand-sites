# Hard Resets — Sanity Studio

Editorial CMS for **Hard Resets** (`hardresets.com`). Schema matches the master content doc and Customer.io email layout.

## First-time setup

1. [sanity.io/manage](https://sanity.io/manage) → project **Hard Resets** (`0vm5rx64`), dataset `production`.
2. Confirm `projectId` in `sanity.config.ts` / `sanity.cli.ts` (or set `SANITY_STUDIO_PROJECT_ID`).
3. `npm install && npm run deploy` — hostname **`hardresets`** → `https://hardresets.sanity.studio`.
4. Enable Canvas: already set in `sanity.config.ts` (`apps.canvas.enabled: true`).
5. In Manage → Studios → **Show in Dashboard** so Canvas lists the studio.

## Canvas

Paste template: `canvas-templates/hard-reset-issue-template.md`  
Mapping: [`GOOGLE_DOC_MAPPING.md`](./GOOGLE_DOC_MAPPING.md)  
Troubleshooting: [`docs/HARDRESETS_CANVAS.md`](../docs/HARDRESETS_CANVAS.md)

## Marketing site

The Next.js app lives at **`apps/hardresets`** (Vercel root directory `apps/hardresets`). It reads this Sanity project via `NEXT_PUBLIC_SANITY_PROJECT_ID=0vm5rx64`.

Env checklist: [`docs/HARDRESETS_VERCEL_ENV.md`](../docs/HARDRESETS_VERCEL_ENV.md).
