# Hard Resets (site app)

Next.js marketing site for **Hard Resets** (`hardresets.com`).

## Local dev

1. From repo root: `pnpm install`
2. Copy env into `apps/hardresets/.env.local`:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3004
NEXT_PUBLIC_BRAND_ID=hardresets
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.hardresets.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.hardresets.com
NEXT_PUBLIC_SANITY_PROJECT_ID=0vm5rx64
NEXT_PUBLIC_SANITY_DATASET=production
```

3. `pnpm exec turbo dev --filter=hardresets`
4. Vercel **Root Directory**: `apps/hardresets`

## Brand assets

Header/footer logos live in `public/hr-*` (wordmark + H|R mark, black and white). Favicon / Apple touch: `hr-webclip.png`. OG/social preview: `hr-phone.png`.

## CMS

Sanity Studio: [hardresets.sanity.studio](https://hardresets.sanity.studio)  
Canvas template: `studio-hard-resets/canvas-templates/hard-reset-issue-template.md`  
Vercel env checklist: [`docs/HARDRESETS_VERCEL_ENV.md`](../../docs/HARDRESETS_VERCEL_ENV.md)

**Note:** The Sanity schema under `apps/hardresets/sanity/` is a lightweight stub for local tooling. The source of truth for editorial fields (`subjectName`, `contentBlocks`, etc.) is **`studio-hard-resets/`**.
