# Launch playbook (new network publication)

Canonical checklist for bringing a brand to **full Next.js + magic + house ads** parity. Stitch this with brand-specific env docs and Hard Resets / Pickle launch notes.

**Maintenance rule:** When you add network functionality that new brands need (house ads, comps pages, content path map, quiz patterns, compliance defaults, etc.), update **this file in the same PR**.

Related:

- Greenfield Next + Sanity: [`THEPICKLEREPORT_LAUNCH_GUIDE.md`](./THEPICKLEREPORT_LAUNCH_GUIDE.md)
- Worker / DNS cutover example: [`HARDRESETS_VERCEL_ENV.md`](./HARDRESETS_VERCEL_ENV.md) (go-live notes)
- Magic brand add: `subscription-functions/docs/ADDING_A_NEW_BRAND.md`
- Magic topology / CORS: `subscription-functions/docs/MAGIC_DEPLOY_TOPOLOGY.md`
- House ads Airtable: [`packages/shared-ads/README.md`](../packages/shared-ads/README.md)
- Content URL prefixes: `@publication-websites/shared-ads/brand-paths`
- Compilations branded pages: `subscription-functions/docs/COMP_AND_MULTI_BRAND_LEADS.md`

---

## Prerequisites

- [ ] Brand id chosen (lowercase, matches BQ / magic / `NEXT_PUBLIC_BRAND_ID`)
- [ ] Domains: apex + www + `magic.<brand>.com`
- [ ] Sanity project + `production` dataset
- [ ] Customer.io (or ESP) transactional + brand campaigns wired in magic
- [ ] Access: Vercel, Cloudflare zone, Airtable house-ads base, Keys PATs

---

## 1. Sanity

- [ ] New Sanity project (or confirm existing)
- [ ] Schema matches content type (article / recipe / slang / vault)
- [ ] Seed at least one publishable document for smoke tests
- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID` / `DATASET` recorded in brand `*_VERCEL_ENV.md`
- [ ] Hosted studio: `deployment.appId` in `sanity.cli.ts`, `npx sanity deploy` (e.g. `hipspeak.sanity.studio`, `fromthevault.sanity.studio`)
- [ ] **Never create documents with dotted IDs** (`slangEntry.coded`). Sanity treats any ID containing `.` as private: invisible to the public API and the site. Use `type-slug` IDs.
- [ ] Marketing apps read published content without a token; do **not** put `SANITY_API_TOKEN` on the marketing Vercel project
- [ ] Backfilling sent issues from Customer.io: `scripts/fetch-hipspeak-issues.mjs --brand=<CODE>` then a dry-run-first importer (FTV: `scripts/import-vault-issues.py`)

---

## 2. App clone checklist (`apps/<brand>`)

Prefer cloning the closest live peer (TPR / TNP / HR / TEC / Hipspeak).

- [ ] Copy app; rename `package.json` name; set `vercel.json` root / `turbo-ignore`
- [ ] `src/config/site.js` defaults (display name, magic URLs, contact, OG)
- [ ] Brand assets under `public/`
- [ ] Content routes (`/article`, `/recipe`, `/word`, …) + middleware slug headers
- [ ] If not `/article/`: add **308** from `/article/{slug}` → canonical path (see Hipspeak `/word`, TEC `/recipe`)
- [ ] Register prefix in **`packages/shared-ads/brand-paths.js`** if non-article
- [ ] Profile uses `contentUrlForBrand` (do not hardcode `/article/` for cross-brand history)
- [ ] Compliance: OneTrust domain script default in `ComplianceScripts.js`
- [ ] `/ai-policy` + footer link; sitemap + robots for utility routes
- [ ] House-ad stack: `HouseAdPool`, `HouseAdImage`, `HouseAdClaimContext`, `/api/house-ads`, layout provider, `AdSlot` prefer pool → static
- [ ] Subscribe-gated sticky (`ArticleStickyBottom`: subscribe CTA vs ad)
- [ ] Compilations: `/opted-out-comps` + `/opted-in-comps` (snooze-card pattern)
- [ ] Network newsletters data includes this brand where appropriate
- [ ] Brand `docs/<BRAND>_VERCEL_ENV.md` paste checklist
- [ ] Staging noindex: wire `NEXT_PUBLIC_NOINDEX` into `site.js` (`isNoindex`), `robots.js` (`Disallow: /`) and layout/article `robots` metadata; set it on Vercel until go-live (see FTV)
- [ ] No polls? Pass `createHomeQueryMiddleware({ poll: null })` in `src/middleware.js` so `/?poll=` stays on the homepage instead of redirecting to a missing `/poll`
- [ ] Already-subscribed sign-in toast, `/sign-in`, `/redirect`: today TPR-local (toast, `/sign-in`) and TNP/HR-local (`/redirect`); moving into `packages/magic-client` after 2026-10-06 — use the shared components once they exist
- [ ] Every absolute URL comes from `NEXT_PUBLIC_SITE_URL` (no hardcoded host), so staging and production hosts can differ
- [ ] Add the brand to [`NETWORK_PARITY_AUDIT.md`](./NETWORK_PARITY_AUDIT.md)

Do **not** import from sibling `apps/*` — share via `packages/*`.

---

## 3. Magic (`subscription-functions`)

All `magic.*` hosts run on **one shared Vercel project**, so every env var is network-wide and every magic push deploys every brand (check for freezes such as a live giveaway first).

- [ ] Follow `ADDING_A_NEW_BRAND.md` (maps, CIO, DNS; attach `magic.<brand>` to the shared magic project)
- [ ] `READERS_CORS_ORIGINS` (one network-wide list) includes apex, www, `<app>.vercel.app`, and the local dev port. **Keep every existing origin.** Unlisted origins fall back to the first entry, which silently breaks profile/favorites for that brand. Verify with a preflight probe per origin:
  `curl -s -o /dev/null -D - -X OPTIONS -H "Origin: https://www.<brand>.com" -H "Access-Control-Request-Method: GET" https://magic.<brand>.com/api/reader-subscriptions | grep -i access-control-allow-origin`
- [ ] Reader flags readiness: `READER_TOKEN_SECRET`, Firestore/BQ as for other live brands
- [ ] Add brand to `BRANDED_COMPS_CONFIRMATION` in `api/comps-preference.js` when branded comps pages ship
- [ ] Site not on `https://<brand>.com`? Set `BRAND_SITE_ORIGIN_<SLUG>` on magic (unsubscribe/snooze/comps return URLs)
- [ ] Subdomain host? Add it to `api/process-retention-csv.js` and check the regex in `lib/cross-brand-email-lead.js`
- [ ] Update `MAGIC_DEPLOY_TOPOLOGY.md` row + CORS table
- [ ] Deploy magic; `curl` `https://magic.<brand>/api/reader-health`

---

## 4. Vercel marketing

- [ ] New project; **Root Directory** `apps/<brand>`
- [ ] Env from brand `*_VERCEL_ENV.md` (site URL, magic origins, Sanity, OneTrust, GTM/GA/Meta, Airtable house ads **server-only**)
- [ ] `NEXT_PUBLIC_READER_EVENTS_ENABLED` / `NEXT_PUBLIC_READER_PROFILE_V2` when ready
- [ ] Production deploy green
- [ ] Attach apex + www; set canonical `NEXT_PUBLIC_SITE_URL`; apex→www 308 if using www canonical

---

## 5. Airtable house ads

- [ ] Add brand to **All Brands** and to **Destination Brands** on every creative that should run there. An empty Destination Brands list means "everywhere", but most creatives have explicit lists, so a new brand's pool is **empty** until it's added (Hipspeak's pool was empty for this reason until 2026-09-28). Never add a brand to its own creatives.
- [ ] **Click URL** formula brand-aware (keep in sync with `brand-paths.js`):
  - Default → `https://{host}/article/{slug}`
  - TEC → `/recipe/{slug}`
  - Hipspeak → `/word/{slug}`
- [ ] Spot-check creatives targeting the new host after formula change
- [ ] Marketing env: `AIRTABLE_HOUSE_ADS_BASE_ID`, `AIRTABLE_HOUSE_ADS_TABLE_ID`, `AIRTABLE_API_KEY` (Sensitive; `Keys/AIRTABLE_HOUSEADS.txt`)
- [ ] Verify: `curl -s "https://<host>/api/house-ads?slot=inArticle"` returns an `ad`. `{"ad":null}` means no eligible creatives or a bad token — check runtime logs for `[house-ads] Airtable fetch failed 403`.

---

## 6. Cloudflare cutover (when replacing Webflow / worker landing)

Pattern from Hard Resets:

1. Confirm Vercel marketing serves correctly on `*.vercel.app` / assigned domain
2. Attach custom domains on Vercel; wait for verification
3. On Cloudflare zone: **remove/disable** worker routes (e.g. `webflow-proxy`) that intercept apex/`www`
4. DNS: apex + `www` **CNAME → Vercel** target, **DNS-only** (grey cloud)
5. SSL Full (strict); leave MX/email untouched
6. Confirm OneTrust / GTM / GA fire on production host

---

## 7. Smoke tests

- [ ] Homepage + primary content URL
- [ ] Subscribe → magic → return with `subscribed=true` / reader token
- [ ] Profile Bearer subscriptions (no BQ from marketing)
- [ ] Unsub / snooze confirmation pages
- [ ] Comps opt-out / opt-in branded pages (`?process=1` JSON round-trip)
- [ ] House ad impression on a content page (Airtable or static fallback)
- [ ] Sticky: subscribed sees ad; anonymous sees subscribe CTA
- [ ] `/ai-policy` + footer
- [ ] Brand-specific extras (e.g. Hipspeak `/quiz` gate → subscribe → score)
- [ ] TPR giveaways: keep `listed: false` until public; URLs + CIO still work (see [`GIVEAWAYS.md`](./GIVEAWAYS.md))

---

## 8. Post-launch

- [ ] Search Console / Bing verification if needed
- [ ] Mark env doc go-live rows ✅
- [ ] Confirm `turbo-ignore` only rebuilds this app + dependents on shared package changes
- [ ] Update this playbook if you introduced a new reusable pattern

---

## Content path map (source of truth)

| Brand id | Content path |
|----------|--------------|
| Most brands | `/article/{slug}` |
| `theeyeballerscookbook` | `/recipe/{slug}` |
| `hipspeak` | `/word/{slug}` |

Code: `packages/shared-ads/brand-paths.js` (`contentPathForBrand`, `contentUrlForBrand`, `contentSlugFromPathname`).  
Analytics: `PageViewTracker` uses `contentSlugFromPathname`.  
Airtable Click URL formulas must match.

---

## Hipspeak go-live (manual cutover)

Use alongside [`HIPSPEAK_VERCEL_ENV.md`](./HIPSPEAK_VERCEL_ENV.md).

Status as of 2026-09-28. The step-by-step cutover checklist, rollback and Airtable formula are in `HIPSPEAK_VERCEL_ENV.md`.

### Airtable (you)

- [x] Add **Hipspeak** to All Brands / Destination Brands (every active House Ads creative except its own)
- [ ] Paste the brand-aware **Click URL** formula on cutover day (Hipspeak → `https://www.hipspeak.com/word/{slug}`)
- [ ] Spot-check TEC + Hipspeak destination creatives

### Vercel

- [x] Marketing project Root Directory `apps/hipspeak`; env from `HIPSPEAK_VERCEL_ENV.md`
- [x] OneTrust `019a7167-e6eb-7fa2-ae9f-60338480c772`; Meta / GTM; Airtable house-ads base/table
- [x] GA4 measurement ID (new Hipspeak property: `G-V8T90TBR3Z`)
- [x] `AIRTABLE_API_KEY` Sensitive, from `Keys/AIRTABLE_HOUSEADS.txt`
- [x] `NEXT_PUBLIC_SITE_URL=https://www.hipspeak.com`
- [x] Attach `www.hipspeak.com` (production) and `hipspeak.com` (308 → www); both verified
- [x] Reader flags on

### Code

- [x] My Words at TEC-favorites parity: subscription-gated, synced via reader events, `/my-words?add=` deep link, profile merge
- [x] Quiz hardened, with GA events (`quiz_start`, `quiz_complete`)
- [x] Legacy Webflow URLs checked (only `/privacy`, `/terms`, `/pollresults/{slug}`, all native routes)
- [ ] Shared sign-in toast, `/sign-in`, `/redirect`, sticky refresh (post Oct 6 shared packages)

### Magic

- [x] `magic.hipspeak.com` on the shared magic project; CORS includes apex, www, `hipspeak.vercel.app`, `http://localhost:3006`
- [ ] Deploy magic with `hipspeak` in `BRANDED_COMPS_CONFIRMATION` (post Oct 6)
- [x] `reader-health` 200

### Cloudflare (you)

- [x] Disable **webflow-proxy** worker routes on hipspeak.com
- [x] DNS apex/`www` → Vercel **DNS-only** (project-specific CNAME from the Vercel Domains page)
- [x] Post-cutover smoke (list in `HIPSPEAK_VERCEL_ENV.md`), live 2026-09-29

---

## From the Vault go-live

Use alongside [`HEEBNEWSLETTERS_VERCEL_ENV.md`](./HEEBNEWSLETTERS_VERCEL_ENV.md) (staging status, host options, Airtable formula). FTV runs on `heebnewsletters.vercel.app` with `NEXT_PUBLIC_NOINDEX=true` until the host is chosen.

### Done (staging-ready)

- [x] OneTrust with no borrowed fallback; subscribe-gated sticky; `/ai-policy`; comps pages; archive search; `isJewishContent`; no submissions; no polls (`poll: null`)
- [x] Vercel: GTM, Meta, reader flags, Airtable base/table, noindex; `SANITY_API_TOKEN` removed
- [x] Magic CORS covers staging, apex, www and `fromthevault.` subdomain
- [x] Airtable: From the Vault in Destination Brands
- [x] Hosted studio with body images; Customer.io → Sanity import tooling

### Before production

- [ ] Choose the host (apex/www or `fromthevault.heebnewsletters.com`)
- [x] FTV OneTrust domain script; `AIRTABLE_API_KEY` (Sensitive)
- [ ] GA4 measurement ID
- [ ] Post-Oct 6: shared house-ad pool, sign-in toast, `/sign-in`, `/redirect`; magic push (comps, retention, return host)
- [ ] Import newer sent issues and missing #28 from supplied HTML (`publishedDate` = Customer.io send time; older issues corrected 2026-09-28)
- [ ] Legacy Webflow URL 308s; cutover steps in `HEEBNEWSLETTERS_VERCEL_ENV.md`; delete `NEXT_PUBLIC_NOINDEX`
