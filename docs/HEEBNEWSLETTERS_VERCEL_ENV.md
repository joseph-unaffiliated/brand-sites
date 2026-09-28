# From the Vault, by Heeb — Vercel environment variables (copy/paste)

From the Vault is **its own brand**: marketing on staging at `heebnewsletters.vercel.app` until the production host is chosen (see [Host decision](#host-decision-open)), subscriptions and reader APIs on **`magic.heebnewsletters.com`**. It does **not** share magic hosts or env defaults with any other brand.

Use this on the **marketing** Vercel project: **Root Directory** = `apps/heebnewsletters`.

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

### Marketing (`heebnewsletters.com`) — Root Directory `apps/heebnewsletters`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://heebnewsletters.com` |
| `NEXT_PUBLIC_BRAND_ID` | `heebnewsletters` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.heebnewsletters.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.heebnewsletters.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `m4gmd2lf` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `From the Vault, by Heeb` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `The 2000s in your inbox — a weekly dive into subversive Jewish counter-culture nostalgia from Heeb.` |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/ftv-wordmark-black.png` |
| `NEXT_PUBLIC_SITE_FAVICON` | `/ftv-favicon.ico` |
| `NEXT_PUBLIC_SITE_FAVICON_PNG` | `/ftv-favicon.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `The 2000s in your inbox. Delivered weekly.` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `The 2000s in your inbox` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@heebnewsletters.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Get From the Vault` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Subscribe card blurb |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo` (slot → brand map is in `apps/heebnewsletters/src/config/crossPromoAds.js` — the '90s Parent + Pickle only; never From the Vault) |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | `809409995127436` ✅ |
| `NEXT_PUBLIC_GTM_ID` | `GTM-TVHD6JMG` ✅ (same container as other Unaffiliated sites) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⚠️ UPDATE — create a new GA4 property for this brand |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ⚠️ UPDATE — OneTrust domain script UUID for **heebnewsletters.com** |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

| `NEXT_PUBLIC_NOINDEX` | `true` on staging (robots `Disallow: /` + `noindex` meta). **Delete at go-live.** |
| `NEXT_PUBLIC_READER_EVENTS_ENABLED` / `NEXT_PUBLIC_READER_PROFILE_V2` | `true` |
| `AIRTABLE_HOUSE_ADS_BASE_ID` | `appXFQv3Hy0wUDDnb` |
| `AIRTABLE_HOUSE_ADS_TABLE_ID` | `tblB3emRodWIzabTP` |
| `AIRTABLE_API_KEY` | ⚠️ UPDATE — **server-only, Sensitive.** Same token as the other brands. Used once FTV adopts the shared house-ad pool (post Oct 6). |

**Do not add to marketing:** `SANITY_API_TOKEN` (published content is public; removed 2026-09-28), `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

**Do not set** `NEXT_PUBLIC_SHARED_ADS_BRAND=heebnewsletters`. Until FTV adopts the shared house-ad pool, static creatives rotate other brands via `crossPromoAds.js`; after that, Airtable Destination Brands (which already include From the Vault) drive it.

### Magic (`magic.heebnewsletters.com`) — shared `subscription-functions` Vercel project

Every `magic.*` host is served by one Vercel project, so these values are network-wide:

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Shared network secret (already set) |
| `READERS_CORS_ORIGINS` | Shared network list; includes `https://heebnewsletters.vercel.app`, `https://heebnewsletters.com`, `https://www.heebnewsletters.com`, `https://fromthevault.heebnewsletters.com`, `http://localhost:3007` (verified 2026-09-28) |
| `BRAND_SITE_ORIGIN_HEEBNEWSLETTERS` | Only if FTV launches on a host other than `https://heebnewsletters.com` (e.g. `https://fromthevault.heebnewsletters.com`). Magic uses it for unsubscribe/snooze and branded comps return URLs. Requires the post-Oct 6 magic push. |

Brand entries live in the **subscription-functions** repo (`../subscription-functions`) — see `docs/ADDING_A_NEW_BRAND.md` there, brand id `heebnewsletters`.

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`heebnewsletters.com`)

```env
# --- Core site & From the Vault magic only ---
NEXT_PUBLIC_SITE_URL=https://heebnewsletters.com
NEXT_PUBLIC_BRAND_ID=heebnewsletters
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.heebnewsletters.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.heebnewsletters.com

NEXT_PUBLIC_SANITY_PROJECT_ID=m4gmd2lf
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=From the Vault, by Heeb
NEXT_PUBLIC_SITE_DESCRIPTION=The 2000s in your inbox — a weekly dive into subversive Jewish counter-culture nostalgia from Heeb.
NEXT_PUBLIC_SITE_OG_IMAGE=/ftv-wordmark-black.png
NEXT_PUBLIC_SITE_FAVICON=/ftv-favicon.ico
NEXT_PUBLIC_SITE_FAVICON_PNG=/ftv-favicon.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=The 2000s in your inbox. Delivered weekly.
NEXT_PUBLIC_SITE_HERO_TAGLINE=The 2000s in your inbox
NEXT_PUBLIC_CONTACT_EMAIL=contact@heebnewsletters.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE=Get From the Vault
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=Join the newsletter for weekly subversive Jewish counter-culture nostalgia from the 2000s—delivered straight to your inbox.
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs

NEXT_PUBLIC_ADS_MODE=cross_promo
# No NEXT_PUBLIC_SHARED_ADS_BRAND — see apps/heebnewsletters/src/config/crossPromoAds.js

NEXT_PUBLIC_META_PIXEL_ID=809409995127436
NEXT_PUBLIC_GTM_ID=GTM-TVHD6JMG
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE

NEXT_PUBLIC_READER_EVENTS_ENABLED=true
NEXT_PUBLIC_READER_PROFILE_V2=true

# Staging only — delete at go-live
NEXT_PUBLIC_NOINDEX=true

# House ads (server-only — do not prefix NEXT_PUBLIC_)
AIRTABLE_HOUSE_ADS_BASE_ID=appXFQv3Hy0wUDDnb
AIRTABLE_HOUSE_ADS_TABLE_ID=tblB3emRodWIzabTP
# AIRTABLE_API_KEY=
```

## Routes smoke-check

- `/` — latest vault issue + recent archive
- `/article/[slug]` — vault issue detail (editor intro, hero, body, rabbit hole)
- `/archive` — chronological issue list with title/dek search
- `/about` — brand story
- `/profile` — reader profile / subscriptions (requires magic reader token)
- `/opted-out-comps` / `/opted-in-comps` — compilations preference confirmation
- `/ai-policy` — AI policy
- `/?poll=a` — stays on the homepage (FTV has no polls)

---

## Staging status (2026-09-28)

FTV stays on **`https://heebnewsletters.vercel.app`** with noindex only (no Vercel Deployment Protection). All absolute URLs come from `NEXT_PUBLIC_SITE_URL`, so the code is host-agnostic.

| Item | Status |
|------|--------|
| `NEXT_PUBLIC_NOINDEX=true` | ✅ robots `Disallow: /`, `noindex, nofollow` meta |
| `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_META_PIXEL_ID` | ✅ `GTM-TVHD6JMG` / `809409995127436` |
| Reader flags | ✅ |
| `SANITY_API_TOKEN` | ✅ removed from the marketing project |
| `AIRTABLE_HOUSE_ADS_*` | ✅ base/table set; ⚠️ `AIRTABLE_API_KEY` still to add (Sensitive) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ⚠️ waiting on a new FTV GA4 property |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ⚠️ waiting on an FTV OneTrust domain script. `ComplianceScripts.js` has no fallback, so no banner loads until it's set (no more borrowing TPR's). |
| Magic CORS | ✅ staging, apex, www, `fromthevault.` subdomain, `localhost:3007` |
| Magic comps / retention / cross-brand / configurable return host | ⚠️ local in `subscription-functions`; ships with the post-Oct 6 magic push |
| Airtable Destination Brands | ✅ From the Vault added to every active House Ads creative except its own |
| Hosted studio | ✅ [fromthevault.sanity.studio](https://fromthevault.sanity.studio/) (body images enabled) |
| Content | ⚠️ newest issue in Sanity is #31. Sent issues #32–35 are ready to import with `scripts/import-vault-issues.py` (see `studio-heebnewsletters/README.md`) once approved. |
| Shared sign-in toast, `/sign-in`, `/redirect`, house-ad pool | ⏳ post Oct 6 (shared packages) |

## Host decision (open)

The production host is undecided. Both options are prepared: Sanity CORS and magic CORS already allow both hosts, and magic's retention map and cross-brand regex accept the `fromthevault.` subdomain.

Steps for **either** option:

1. Post-Oct 6 magic push is live (comps, retention, return-host changes).
2. Set GA4 and OneTrust IDs; add `AIRTABLE_API_KEY` (Sensitive).
3. Crawl the current Webflow site's sitemap and add 308s in `apps/heebnewsletters/next.config.mjs` for any legacy URL shapes (e.g. `/{slug}` → `/article/{slug}`), like TPR's `legacy-article-redirects.mjs`.
4. Set `NEXT_PUBLIC_SITE_URL` to the chosen origin and **delete `NEXT_PUBLIC_NOINDEX`**, then redeploy.
5. Attach the domain(s) on the Vercel project `heebnewsletters` and wait for verification.
6. Cloudflare (heebnewsletters.com zone): disable any worker routes on the chosen host, add DNS-only records pointing to Vercel, SSL Full (strict). Leave MX/SPF/verification TXT records and `magic.heebnewsletters.com` alone.
7. Paste the Airtable Click URL change below, then spot-check FTV creatives.
8. Search Console verification; smoke tests from [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md) section 7.

**Option A — apex/www (`heebnewsletters.com`):** DNS `A heebnewsletters.com → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`. Magic's default return host is already `https://heebnewsletters.com`, so no `BRAND_SITE_ORIGIN_*` is needed. If www is canonical, the apex 308 preserves `subscribed`/`email` params. This replaces whatever Webflow serves at the apex today.

**Option B — subdomain (`fromthevault.heebnewsletters.com`):** DNS `CNAME fromthevault → cname.vercel-dns.com`. On the magic project set `BRAND_SITE_ORIGIN_HEEBNEWSLETTERS=https://fromthevault.heebnewsletters.com` and redeploy magic. The apex can keep serving the Heeb site.

### Airtable Click URL (FTV part, cutover day only)

Today the formula sends FTV creatives to the Webflow shape `https://heebnewsletters.com/{slug}`. On cutover day, drop the `{Code} = "FTV"` special case so FTV uses `/article/{slug}`. Starting from the Hipspeak formula in [`HIPSPEAK_VERCEL_ENV.md`](./HIPSPEAK_VERCEL_ENV.md):

```text
IF(
  {Ad type} = "House Ads",
  "https://" &
    IF({Code} = "HIP", "www.", IF({Code} = "FTV", "fromthevault.", "")) &
    {Brand} & ".com/" &
    IF(
      {Slug},
      IF({Code} = "TEC", "recipe/",
        IF({Code} = "HIP", "word/", "article/")) & {Slug}
    )
)
```

For Option A, remove `IF({Code} = "FTV", "fromthevault.", "")` (use `""`), or use `"www."` if www is canonical.
