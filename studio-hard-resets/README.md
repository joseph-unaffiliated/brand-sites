# Hard Resets — Sanity Studio

Editorial CMS for **Hard Resets** (`hardresets.com`). Schema matches the master content doc and Customer.io email layout.

## First-time setup

1. [sanity.io/manage](https://sanity.io/manage) → create project **Hard Resets**, dataset `production`.
2. Replace `YOUR_SANITY_PROJECT_ID` in `sanity.config.ts` and `sanity.cli.ts`.
3. `npm install && npm run deploy` — choose hostname **`hardresets`** → `https://hardresets.sanity.studio`.
4. Enable Canvas: already set in `sanity.config.ts` (`apps.canvas.enabled: true`).
5. In Manage → Studios → **Show in Dashboard** so Canvas lists the studio.

## Canvas

Paste template: `canvas-templates/hard-reset-issue-template.md`  
Mapping: [`GOOGLE_DOC_MAPPING.md`](./GOOGLE_DOC_MAPPING.md)  
Troubleshooting: [`docs/HARDRESETS_CANVAS.md`](../docs/HARDRESETS_CANVAS.md)

## Marketing site

The Next.js app (`apps/hardresets`, not yet in repo) reads this project via `NEXT_PUBLIC_SANITY_PROJECT_ID`. Deploy studio schema before importing issues.
