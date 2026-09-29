# Hipspeak — Vercel environment variables (copy/paste)

Hipspeak is **its own brand**: marketing on `www.hipspeak.com` (apex 308s to www), subscriptions and reader APIs on **`magic.hipspeak.com`**. It does **not** share magic hosts or env defaults with any other brand.

Use this on the **marketing** Vercel project: **Root Directory** = `apps/hipspeak`.

**How to paste:** Vercel → Project → **Settings** → **Environment Variables** → add each line, or use **Import .env** and paste the block below (skip `#` comment lines if your importer rejects them).

**Legend**

| Marker | Meaning |
|--------|---------|
| `✅` | Matches repo defaults — paste as-is unless you intentionally change it |
| `⚠️ UPDATE` | Replace with your real value before saving |
| `⏭️ OPTIONAL` | Omit until you need the feature |

After saving: **Redeploy** Production (and Preview if you added vars there).

---

## Plain checklist (two Vercel projects)

### Marketing (`www.hipspeak.com`) — Root Directory `apps/hipspeak`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://www.hipspeak.com` |
| `NEXT_PUBLIC_BRAND_ID` | `hipspeak` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.hipspeak.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.hipspeak.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `idpyzq1z` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `Hipspeak` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `The Dictionary of Slang. One word a week, decoded.` |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/hip-photo.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `The Dictionary of Slang. Delivered weekly.` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `The Dictionary of Slang` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@hipspeak.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Get Hipspeak` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Subscribe card blurb |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` (static fallback in `crossPromoAds.js`; Airtable house ads take priority when configured) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | ⚠️ UPDATE — set on Vercel (network or brand pixel) |
| `NEXT_PUBLIC_GTM_ID` | ⚠️ UPDATE — same GTM container as other Unaffiliated sites when ready |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ `G-V8T90TBR3Z` (production + preview) |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | `019a7167-e6eb-7fa2-ae9f-60338480c772` ✅ (also baked into `ComplianceScripts.js`) |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `AIRTABLE_HOUSE_ADS_BASE_ID` | `appXFQv3Hy0wUDDnb` — house-ads pool (`/api/house-ads`) |
| `AIRTABLE_HOUSE_ADS_TABLE_ID` | `tblB3emRodWIzabTP` |
| `AIRTABLE_API_KEY` | **Server-only, Sensitive.** `Keys/AIRTABLE_HOUSEADS.txt` — do not commit. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

**Do not add to marketing:** `SANITY_API_TOKEN`, `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

House ads rotate **other** brands onto Hipspeak via Airtable Destination Brands (never self-promo). Static `crossPromoAds.js` is fallback only.

### Magic (`magic.hipspeak.com`) — shared `subscription-functions` Vercel project

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Generate once: `openssl rand -hex 32` |
| `READERS_CORS_ORIGINS` | Shared network list; must include `https://hipspeak.com`, `https://www.hipspeak.com`, `https://hipspeak.vercel.app`, `http://localhost:3006` |
| `GCP_PROJECT_ID` | Your GCP project |
| `GCP_SERVICE_ACCOUNT_KEY` | Service account JSON for BigQuery/subscribers |

The brand also needs entries in the **subscription-functions** repo — follow `subscription-functions/docs/ADDING_A_NEW_BRAND.md` with brand id `hipspeak`.

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`www.hipspeak.com`)

```env
# --- Core site & Hipspeak magic only ---
NEXT_PUBLIC_SITE_URL=https://www.hipspeak.com
NEXT_PUBLIC_BRAND_ID=hipspeak
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.hipspeak.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.hipspeak.com

NEXT_PUBLIC_SANITY_PROJECT_ID=idpyzq1z
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=Hipspeak
NEXT_PUBLIC_SITE_DESCRIPTION=The Dictionary of Slang. One word a week, decoded.
NEXT_PUBLIC_SITE_OG_IMAGE=/hip-photo.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=The Dictionary of Slang. Delivered weekly.
NEXT_PUBLIC_SITE_HERO_TAGLINE=The Dictionary of Slang
NEXT_PUBLIC_CONTACT_EMAIL=contact@hipspeak.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE=Get Hipspeak
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=One word a week — decoded for humans who don't want to cringe.
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs

NEXT_PUBLIC_ADS_MODE=cross_promo

# Set on Vercel when ready (Meta / GTM / GA4)
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-V8T90TBR3Z
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=019a7167-e6eb-7fa2-ae9f-60338480c772
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE

# House ads (server-only — do not prefix NEXT_PUBLIC_)
# AIRTABLE_HOUSE_ADS_BASE_ID=appXFQv3Hy0wUDDnb
# AIRTABLE_HOUSE_ADS_TABLE_ID=tblB3emRodWIzabTP
# AIRTABLE_API_KEY=
```

## Routes smoke-check

- `/` — latest slang entry (“word of the week”)
- `/word/coded` — Coded sample entry
- `/archive` — chronological word list
- `/my-words` — saved words (subscribers; synced to the reader profile)
- `/quiz` — slang knowledge quiz (subscribe to see results)
- `/pollresults/coded?poll=a` — pop quiz results
- `/opted-out-comps` / `/opted-in-comps` — compilations preference confirmation
- `/ai-policy` — AI policy

---

## Go-live status

Canonical host is **`https://www.hipspeak.com`**; the apex 308s to `www` (Vercel domain redirect, path and query preserved, so magic's `https://hipspeak.com/?subscribed=true&email=…` and `/my-words?add=…` links survive).

| Item | Status |
|------|--------|
| `NEXT_PUBLIC_SITE_URL=https://www.hipspeak.com` | ✅ set 2026-09-28 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | ✅ `kr8Lng5KcVPHt8VuzQrT9kyMAxJOBzzUtx3WeUXPC04` (same token as the Webflow page; the zone also has a DNS TXT verification) |
| `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_META_PIXEL_ID` | ✅ `GTM-TVHD6JMG` / `809409995127436` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ `G-V8T90TBR3Z` set 2026-09-28 and live in the page. Re-checked 2026-09-28: published `GTM-TVHD6JMG` has no `G-*` IDs, so direct gtag won't double count. |
| `AIRTABLE_API_KEY` | ✅ Sensitive, from `Keys/AIRTABLE_HOUSEADS.txt` (2026-09-28); `/api/house-ads` serves pool ads |
| Airtable Destination Brands | ✅ Hipspeak added to every active House Ads creative except its own (2026-09-28) |
| Domains on Vercel project `hipspeak` | ✅ `www.hipspeak.com` (production) and `hipspeak.com` (308 → www), both verified; DNS still points at Cloudflare/Webflow |
| Magic CORS (`READERS_CORS_ORIGINS`) | ✅ apex, www, `hipspeak.vercel.app`, `http://localhost:3006` |
| Magic `BRANDED_COMPS_CONFIRMATION` includes `hipspeak` | ⚠️ local only; ships with the post-Oct 6 magic push |
| Hosted studio | ✅ [hipspeak.sanity.studio](https://hipspeak.sanity.studio/) |
| Legacy Webflow URLs | ✅ only `/privacy`, `/terms`, `/pollresults/{slug}` existed; all three are native Next routes |

## Airtable Click URL formula (Creatives → `Click URL`)

Paste on cutover day (not before: `www.hipspeak.com/word/…` 404s until DNS moves).

Before:

```text
IF(
  {Ad type} = "House Ads",
  "https://" & {Brand} & ".com/" &
    IF(
      {Slug},
      IF(
        {Code} = "FTV", "",
        IF({Code} = "TEC", "recipe/", "article/")
      ) & {Slug}
    )
)
```

After (Hipspeak → `https://www.hipspeak.com/word/{slug}`; everything else unchanged):

```text
IF(
  {Ad type} = "House Ads",
  "https://" & IF({Code} = "HIP", "www.", "") & {Brand} & ".com/" &
    IF(
      {Slug},
      IF(
        {Code} = "FTV", "",
        IF({Code} = "TEC", "recipe/",
          IF({Code} = "HIP", "word/", "article/"))
      ) & {Slug}
    )
)
```

Hipspeak is already in Destination Brands on every active House Ads creative except its own.

## Cloudflare cutover checklist (hipspeak.com zone)

Pre-flight (all must be true):

- [ ] Latest `apps/hipspeak` production deploy is green on `https://hipspeak.vercel.app`
- [ ] `curl -s https://magic.hipspeak.com/api/reader-health` returns 200
- [ ] Note the current DNS records and worker routes (screenshot) for rollback

Cutover:

1. **Workers Routes** → disable or delete the `webflow-proxy` routes for `hipspeak.com/*` and `www.hipspeak.com/*`. Leave `magic.hipspeak.com` alone.
2. **DNS**: use the project-specific records Vercel shows under Project `hipspeak` → Domains. Set both to **DNS only** (grey cloud), and replace any existing `A`/`AAAA`/`CNAME` records for these names:
   - `CNAME` `@` → `143f5568a99746ca.vercel-dns-016.com` (Cloudflare flattens this at the apex)
   - `CNAME` `www` → `143f5568a99746ca.vercel-dns-016.com`
   - The legacy `A 76.76.21.21` / `CNAME cname.vercel-dns.com` records still work but are no longer Vercel's recommendation.
3. **SSL/TLS** → Full (strict).
4. Do **not** touch MX (Google Workspace), SPF, or the `google-site-verification` / `yahoo-verification-key` TXT records.
5. Vercel → Project `hipspeak` → Domains: wait for both to show "Valid Configuration" and certificates issued.
6. Paste the Airtable formula above.

7. After smoke passes: retire the **Webflow Poll Results** staff tool in `unaffiliated-analytics` (remove the `/tools/webflow-poll` entry from `src/lib/tools-catalog.ts`, then delete `src/app/(dashboard)/tools/webflow-poll/`, `src/app/api/tools/webflow-poll/` and `src/lib/webflow/`). Hipspeak polls now come from `slangEntry.pollOptions`, which the **Email → Sanity** tool already fills. Do this after the Oct 6 draw, since that app hosts the giveaway entrants page.

Rollback (if smoke fails): re-enable the `webflow-proxy` routes, set the two records back to proxied (orange cloud) as in the pre-flight screenshot, and revert the Airtable formula. Vercel domains can stay attached.

Post-cutover smoke:

- [ ] `curl -sI https://hipspeak.com/word/coded?poll=a` → 308 to `https://www.hipspeak.com/word/coded?poll=a`
- [ ] `https://hipspeak.com/?subscribed=true&email=test%40example.com` lands on `/subscribed` on www with params intact
- [ ] `/`, `/word/{slug}`, `/archive`, `/my-words`, `/quiz`, `/pollresults/npc?poll=a`, `/privacy`, `/terms`
- [ ] Subscribe → magic → back with reader token; `/profile` loads subscriptions
- [ ] Heart a word as a subscriber; it appears on another device via `/my-words`
- [ ] Quiz: gate → subscribe → score; returning subscriber skips the gate
- [ ] House ad renders and click URL is correct; `/opted-out-comps` and `/opted-in-comps`
- [ ] OneTrust banner, GTM, Meta pixel fire on `www.hipspeak.com`
- [ ] `https://www.hipspeak.com/sitemap.xml` and `robots.txt` use the www host
