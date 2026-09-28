# Hipspeak — Sanity Studio

Content studio for [www.hipspeak.com](https://www.hipspeak.com) (Sanity project `idpyzq1z`, dataset `production`). One `slangEntry` document per Dictionary of Slang email issue.

- **Hosted studio:** [hipspeak.sanity.studio](https://hipspeak.sanity.studio/) (`deployment.appId` in `sanity.cli.ts`, auto-updates on).
- **Local:** `npm install`, then `npm run dev`.
- **Redeploy after schema changes:** `npm run deploy`.
- **Site wiring:** `NEXT_PUBLIC_SANITY_PROJECT_ID=idpyzq1z` on the Vercel project for `apps/hipspeak` (see `docs/HIPSPEAK_VERCEL_ENV.md`).
- **CORS origins:** `http://localhost:3006`, `https://hipspeak.vercel.app`, `https://www.hipspeak.com`, `https://hipspeak.com`.

## Importing past email issues

Sent issues live in Customer.io as broadcasts named `HIP - Issue 17 - Nasty`. The
**Broadcast Message Name** is the identifier, not the subject line. Importing is two steps.

### 1. Export the HTML from Customer.io

Needs a Customer.io **App API key** with read access to newsletters (broadcasts are
"newsletters" in the App API).

```bash
CUSTOMER_IO_APP_API_KEY=… node scripts/fetch-hipspeak-issues.mjs --dry-run   # from the repo root
CUSTOMER_IO_APP_API_KEY=… node scripts/fetch-hipspeak-issues.mjs
```

Writes one file per issue to `issues/hipspeak/` (`Issue-17-Nasty.html`) plus
`issues-catalog.json`, which records the issue number, word, slug, and send date.
Unsent broadcasts are skipped unless you pass `--include-unsent`. Set
`CUSTOMER_IO_API_REGION=eu` for an EU workspace.

### 2. Create the Sanity documents

```bash
node scripts/import-slang-issues.mjs --dry-run              # parse and report, no writes
node scripts/import-slang-issues.mjs --issue=17 --inspect   # dump every parsed block
SANITY_API_TOKEN=… npm run import-slang-issues              # write drafts
SANITY_API_TOKEN=… npm run import-slang-issues -- --publish # write published docs
```

Drafts are the default so you can review in Studio before publishing. Documents use
a stable id (`slangEntry-<slug>`), so re-running updates in place rather than duplicating.
Never use a dot in the id (`slangEntry.<slug>`): Sanity treats dotted ids as private, so
the public API the site reads never returns them.

Customer.io generates per-template hashed CSS class names, so the parser keys on the
brand-stable copy markers instead: `Think:`, `In Use`, `Pop Quiz`, `What else?`, and
`Disclaimer:`. Pop Quiz options come from the `?poll=a` vote links, which is what
`/pollresults/[slug]` expects. If a template change breaks a field, run `--inspect`
to see the block list and adjust the markers in `MARKERS` near the top of the script.
