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

Do **not** import from sibling `apps/*` — share via `packages/*`.

---

## 3. Magic (`subscription-functions`)

- [ ] Follow `ADDING_A_NEW_BRAND.md` (maps, CIO, DNS, Vercel project for `magic.<brand>`)
- [ ] `READERS_CORS_ORIGINS` includes apex, www, and local dev port
- [ ] Reader flags readiness: `READER_TOKEN_SECRET`, Firestore/BQ as for other live brands
- [ ] Add brand to `BRANDED_COMPS_CONFIRMATION` in `api/comps-preference.js` when branded comps pages ship
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

- [ ] Add brand to **Brands** / **Destination Brands** (and any host multi-selects)
- [ ] **Click URL** formula brand-aware (keep in sync with `brand-paths.js`):
  - Default → `https://{host}/article/{slug}`
  - TEC → `/recipe/{slug}`
  - Hipspeak → `/word/{slug}`
- [ ] Spot-check creatives targeting the new host after formula change
- [ ] Marketing env: `AIRTABLE_HOUSE_ADS_BASE_ID`, `AIRTABLE_HOUSE_ADS_TABLE_ID`, `AIRTABLE_API_KEY`

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

### Airtable (you)

- [ ] Add **Hipspeak** to Brands / Destination Brands
- [ ] Revise House Ads **Click URL** formula for brand-aware paths (Hipspeak → `/word/{slug}`, TEC → `/recipe/{slug}`, else `/article/{slug}`)
- [ ] Spot-check TEC + Hipspeak destination creatives

### Vercel

- [ ] Marketing project Root Directory `apps/hipspeak`; env from `HIPSPEAK_VERCEL_ENV.md`
- [ ] OneTrust `019a7167-e6eb-7fa2-ae9f-60338480c772`; Meta / GTM / GA4; Airtable house-ads vars
- [ ] `NEXT_PUBLIC_SITE_URL` = canonical host once DNS final
- [ ] Attach `hipspeak.com` / `www.hipspeak.com`; production deploy green
- [ ] Enable reader flags when ready

### Magic

- [ ] `magic.hipspeak.com` on subscription-functions; CORS includes apex, www, `http://localhost:3006`
- [ ] Deploy magic with `hipspeak` in `BRANDED_COMPS_CONFIRMATION`
- [ ] `reader-health` 200

### Cloudflare

- [ ] Disable **webflow-proxy** (or equivalent) worker routes on hipspeak.com
- [ ] DNS CNAME apex/`www` → Vercel **DNS-only**; SSL Full (strict)
- [ ] Post-cutover smoke: `/`, `/word/{slug}`, subscribe, profile, `/quiz`, house ad, comps links
