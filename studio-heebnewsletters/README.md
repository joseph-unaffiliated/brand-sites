# From the Vault, by Heeb — Sanity Studio

Content studio for From the Vault (site app `apps/heebnewsletters`, staging at [heebnewsletters.vercel.app](https://heebnewsletters.vercel.app); production host not chosen yet). Sanity project `m4gmd2lf`, dataset `production`. One `vaultIssue` document per weekly email.

- **Hosted studio:** [fromthevault.sanity.studio](https://fromthevault.sanity.studio/) (`deployment.appId` in `sanity.cli.ts`, auto-updates on).
- **Local:** `npm install`, then `npm run dev`.
- **Redeploy after schema changes:** `npm run deploy`.
- **Body images:** the Body field accepts inline images (alt text, caption, credit). The site renders them as figures.
- **Site wiring:** `NEXT_PUBLIC_SANITY_PROJECT_ID=m4gmd2lf` on the Vercel project for `apps/heebnewsletters` (see `docs/HEEBNEWSLETTERS_VERCEL_ENV.md`). The marketing site reads published content only and needs no API token.
- **CORS origins:** `http://localhost:3007`, `http://localhost:3333`, `https://heebnewsletters.vercel.app`, `https://heebnewsletters.com`, `https://www.heebnewsletters.com`, `https://fromthevault.heebnewsletters.com`. Whichever host is chosen at launch is already covered.

## Importing sent email issues

Sent issues are Customer.io broadcasts named `FTV - Issue 32 - Jeff Goldblum`. From the repo root:

```bash
CUSTOMER_IO_APP_API_KEY=… node scripts/fetch-hipspeak-issues.mjs --brand=FTV --out=issues/fromthevault
python3 scripts/import-vault-issues.py                        # dry run: parse + compare with Sanity
python3 scripts/import-vault-issues.py --issue=32 --inspect   # dump one parsed issue
SANITY_API_TOKEN=… python3 scripts/import-vault-issues.py --write            # drafts (review in Studio)
SANITY_API_TOKEN=… python3 scripts/import-vault-issues.py --write --publish  # published
```

`publishedDate` is the Customer.io send time. Slugs already in Sanity are skipped unless you pass `--replace`, so Studio edits are never overwritten by accident. Unsent broadcasts are skipped.

Never use a dot in a document id (`vaultIssue.<slug>`): Sanity treats dotted ids as private, so the public API the site reads never returns them.
