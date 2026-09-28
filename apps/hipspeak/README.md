# Hipspeak (site app)

Next.js publication in the **`brand-sites`** monorepo — *The Dictionary of Slang*. Hipspeak-only magic: `magic.hipspeak.com` (see `src/config/site.js`). Sanity project `idpyzq1z` (studio: `studio-hipspeak/`).

## Routes

- `/` — word of the week + mosaic; `/word/[slug]` — slang entry (Pop Quiz poll, My words heart); `/article/[slug]` 308s to `/word/[slug]`
- `/archive` — all words with search; `/my-words` — saved words (subscription required; syncs to reader profile; `?add={slug}` email deep link)
- `/quiz` — Hipspeak-only slang quiz (subscribe gate → score)
- `/pollresults/[slug]` — Pop Quiz results; `/opted-in-comps`, `/opted-out-comps`, `/ai-policy`, `/profile`

Local dev: `pnpm --filter hipspeak dev` (port 3006). Vercel **Root Directory** = `apps/hipspeak`.

Vercel env copy/paste + go-live status: [`docs/HIPSPEAK_VERCEL_ENV.md`](../../docs/HIPSPEAK_VERCEL_ENV.md).  
Network launch checklist: [`docs/LAUNCH_PLAYBOOK.md`](../../docs/LAUNCH_PLAYBOOK.md).
