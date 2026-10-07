# From the Vault, by Heeb (site app)

Next.js publication in the **`brand-sites`** monorepo: a weekly resurfaced piece from the Heeb archive. Brand id `heebnewsletters`; magic on `magic.heebnewsletters.com` (see `src/config/site.js`). Sanity project `m4gmd2lf` (studio: `studio-heebnewsletters/`).

Production host: `www.heebmagazine.com` (cutover 2026-10-07; `heebnewsletters.vercel.app` still answers and canonicals to www). Every absolute URL comes from `NEXT_PUBLIC_SITE_URL`; nothing hardcodes a host.

## Routes

- `/` — latest issue + mosaic; `/article/[slug]` — vault issue (editor intro, archive piece, Rabbit Hole)
- `/archive` — all issues with search (`?q=`)
- `/profile`, `/subscribed`, `/unsubscribed`, `/snoozed`, `/request`
- `/opted-in-comps`, `/opted-out-comps` — compilations preference confirmation
- `/about`, `/ai-policy`, `/affiliate-disclosure`, `/privacy`, `/terms`, `/contact`

No polls, favorites, quiz, or submissions on this brand. `/?poll=` stays on the homepage.

Local dev: `pnpm --filter heebnewsletters dev` (port 3007). Vercel **Root Directory** = `apps/heebnewsletters`.

Vercel env copy/paste + go-live status: [`docs/HEEBNEWSLETTERS_VERCEL_ENV.md`](../../docs/HEEBNEWSLETTERS_VERCEL_ENV.md).  
Network launch checklist: [`docs/LAUNCH_PLAYBOOK.md`](../../docs/LAUNCH_PLAYBOOK.md).
