# Heeb Magazine (From the Vault) — Vercel environment variables (copy/paste)

The site is **Heeb Magazine** (www.heebmagazine.com at launch). From the Vault is its editorial section and newsletter. Brand id `heebnewsletters`, `magic.heebnewsletters.com` and the sender `fromthevault@heebnewsletters.com` are unchanged.

From the Vault is **its own brand**: marketing on staging at `heebnewsletters.vercel.app` until the team approves the cutover to **`www.heebmagazine.com`** (see [Production host](#production-host-wwwheebmagazinecom)), subscriptions and reader APIs on **`magic.heebnewsletters.com`**. It does **not** share magic hosts or env defaults with any other brand. The site also hosts a headless **shop** at `/shop` backed by the Heeb Media Shopify store (see [Shop](#shop-shop)).

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

### Marketing (`www.heebmagazine.com`) — Root Directory `apps/heebnewsletters`

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://heebnewsletters.com` today (harmless while `NEXT_PUBLIC_NOINDEX` is on) → **`https://www.heebmagazine.com` at cutover** (canonical, sitemap, OG and JSON-LD URLs all derive from it) |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | ⏭️ OPTIONAL — defaults to `303ed7-79.myshopify.com` in code. Only set if Heeb Media moves stores. |
| `NEXT_PUBLIC_BRAND_ID` | `heebnewsletters` |
| `NEXT_PUBLIC_MAGIC_EXECUTE_URL` | `https://magic.heebnewsletters.com/execute` |
| `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` | `https://magic.heebnewsletters.com` |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | `m4gmd2lf` |
| `NEXT_PUBLIC_SANITY_DATASET` | `production` |
| `NEXT_PUBLIC_SITE_DISPLAY_NAME` | `Heeb Magazine` |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | `Heeb Magazine: Irreverent Jewish Counter-culture. Read From the Vault, classic Heeb stories with fresh commentary every week, and shop back issues and merch.` |
| `NEXT_PUBLIC_SITE_OG_IMAGE` | `/heeb-og.png` (1200×630) |
| `NEXT_PUBLIC_SITE_FAVICON` | `/heeb-favicon.ico` |
| `NEXT_PUBLIC_SITE_FAVICON_PNG` | `/heeb-favicon.png` |
| `NEXT_PUBLIC_SITE_FOOTER_TAGLINE` | `From the Vault, in your inbox every week.` |
| `NEXT_PUBLIC_SITE_HERO_TAGLINE` | `home of the subversive jewish counter-culture` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | `contact@heebnewsletters.com` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE` | `Subscribe to our weekly newsletter "From the Vault"` |
| `NEXT_PUBLIC_SUBSCRIBE_CARD_DEK` | Subscribe card blurb |
| `NEXT_PUBLIC_TYPEKIT_KIT_ID` | `xon1hcs` |
| `NEXT_PUBLIC_ADS_MODE` | `cross_promo`: Airtable house-ad pool, split 50/50 between network ads and Heeb's own `Brand Promo` creatives (see "Ads: 50/50 split" below). `apps/heebnewsletters/src/config/crossPromoAds.js` is only the static fallback (the '90s Parent + Pickle). |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | ⏭️ OPTIONAL — only if switching to `adsense` mode |
| `NEXT_PUBLIC_META_PIXEL_ID` | `809409995127436` ✅ |
| `NEXT_PUBLIC_GTM_ID` | `GTM-TVHD6JMG` ✅ (same container as other Unaffiliated sites) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-YJ819KMEG3` ✅ (Heeb Magazine GA4 stream, set 2026-09-29) |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | `01a0eff9-6147-7b24-954c-9cdd560623f4` ✅ (OneTrust domain `heebmagazine.com`, set 2026-09-29). The code default in `ComplianceScripts.js` is still the old `fromthevault.heebnewsletters.com` script `019bc871-7fd9-72d4-b5b2-73c9d4d51d4b` until the Heeb Magazine rebrand commit. |
| `NEXT_PUBLIC_RETENTION_SITE_ID` | `X2JHJ4WE` (network default) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Optional — Search Console token when ready |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | Optional — Bing token when ready |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Optional — omit unless enabling Turnstile |

| `NEXT_PUBLIC_NOINDEX` | `true` on staging (robots `Disallow: /` + `noindex` meta). **Delete at go-live.** |
| `NEXT_PUBLIC_READER_EVENTS_ENABLED` / `NEXT_PUBLIC_READER_PROFILE_V2` | `true` |
| `AIRTABLE_HOUSE_ADS_BASE_ID` | `appXFQv3Hy0wUDDnb` |
| `AIRTABLE_HOUSE_ADS_TABLE_ID` | `tblB3emRodWIzabTP` |
| `AIRTABLE_API_KEY` | ✅ **Server-only, Sensitive.** `Keys/AIRTABLE_HOUSEADS.txt`. Read by `/api/house-ads/pool` (in use since 2026-10-06). |

**Do not add to marketing:** `SANITY_API_TOKEN` (published content is public; removed 2026-09-28), `GCP_*`, `READER_TOKEN_SECRET`, `RETENTION_API_KEY`, `RETENTION_API_ID`.

**Do not set** `NEXT_PUBLIC_SHARED_ADS_BRAND=heebnewsletters`. Airtable Destination Brands (which already include From the Vault) drive the network half; `crossPromoAds.js` is the static fallback.

### Ads: 50/50 split

Half of Heeb's ad impressions are ours (network house ads, commerce), half are Heeb's own (shop, YouTube shows, podcasts, live events).

- **Heeb's creatives** live in the same Airtable Creatives table: `Ad type = Brand Promo`, `Brand` = From the Vault (`heebnewsletters`), `Destination Brands` = From the Vault, `Slot`, `Image`, `Promo URL`, optional `Promo kind` and `Start date` / `End date` (Eastern). Sizes match the network slots: in-article rectangle, rail, and a `stickyDesktop` + `stickyMobile` pair with the same `Promo URL`. `Promo URL` can be a site path like `/shop/<handle>` (same tab, keeps the cart) or any full URL (new tab).
- **Split** (`src/context/AdOwnerContext.js`, `BRAND_AD_SHARE = 0.5`): each article view gives one of rail/bottom to Heeb and the other to the network, at random. On phones (rail hidden) the bottom spot is a coin flip. The subscriber sticky bar starts on a random side and alternates every rotation (45s, then every 30s).
- **Fallback:** if the owning side has nothing for a slot, the other side fills it; the static cross-promo shows only if both are empty. Until Heeb Media supplies creatives, every spot shows network ads.
- **Reporting:** `ad_impression` / `ad_click` carry `adType: "brand_promo"`, `creativeBrand: "heebnewsletters"` and `promoKind` for Heeb's half.
- **Check:** `curl -s "https://www.heebmagazine.com/api/house-ads?slot=rail&owner=brand"` returns a Brand Promo once one is active.

### Magic (`magic.heebnewsletters.com`) — shared `subscription-functions` Vercel project

Every `magic.*` host is served by one Vercel project, so these values are network-wide:

| Name | Value |
|------|-------|
| `READER_TOKEN_SECRET` | Shared network secret (already set) |
| `READERS_CORS_ORIGINS` | Shared network list; includes `https://heebmagazine.com`, `https://www.heebmagazine.com`, `https://heebnewsletters.vercel.app`, `https://heebnewsletters.com`, `https://www.heebnewsletters.com`, `https://fromthevault.heebnewsletters.com`, `http://localhost:3007` (heebmagazine origins added and redeployed 2026-09-29; all 13 network origins re-probed) |
| `BRAND_SITE_ORIGIN_HEEBNEWSLETTERS` | **Set to `https://www.heebmagazine.com` at cutover** (magic uses it for unsubscribe/snooze and branded comps return URLs). Needs the post-Oct 6 magic push to be honored; until then magic returns readers to `https://heebnewsletters.com/…`, which Vercel 308s to `www.heebmagazine.com` with path and query intact, so nothing breaks in between. Do **not** set before DNS flips. |

Brand entries live in the **subscription-functions** repo (`../subscription-functions`) — see `docs/ADDING_A_NEW_BRAND.md` there, brand id `heebnewsletters`.

See [MAGIC_READER_ENV.md](./MAGIC_READER_ENV.md) for reader token + CORS detail.

---

## A) Marketing site (`www.heebmagazine.com`)

```env
# --- Core site & From the Vault magic only ---
# Today: https://heebnewsletters.com (noindex on) — switch at cutover
NEXT_PUBLIC_SITE_URL=https://www.heebmagazine.com
NEXT_PUBLIC_BRAND_ID=heebnewsletters
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.heebnewsletters.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.heebnewsletters.com

NEXT_PUBLIC_SANITY_PROJECT_ID=m4gmd2lf
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=Heeb Magazine
NEXT_PUBLIC_SITE_DESCRIPTION=Heeb Magazine: Irreverent Jewish Counter-culture. Read From the Vault, classic Heeb stories with fresh commentary every week, and shop back issues and merch.
NEXT_PUBLIC_SITE_OG_IMAGE=/heeb-og.png
NEXT_PUBLIC_SITE_FAVICON=/heeb-favicon.ico
NEXT_PUBLIC_SITE_FAVICON_PNG=/heeb-favicon.png
NEXT_PUBLIC_SITE_FOOTER_TAGLINE=From the Vault, in your inbox every week.
NEXT_PUBLIC_SITE_HERO_TAGLINE=home of the subversive jewish counter-culture
NEXT_PUBLIC_CONTACT_EMAIL=contact@heebnewsletters.com
NEXT_PUBLIC_SUBSCRIBE_CARD_TITLE='Subscribe to our weekly newsletter "From the Vault"'
NEXT_PUBLIC_SUBSCRIBE_CARD_DEK=Join the newsletter for weekly subversive Jewish counter-culture nostalgia from the 2000s—delivered straight to your inbox.
NEXT_PUBLIC_TYPEKIT_KIT_ID=xon1hcs

NEXT_PUBLIC_ADS_MODE=cross_promo
# No NEXT_PUBLIC_SHARED_ADS_BRAND — Airtable pool (50/50 with Heeb Brand Promo); crossPromoAds.js is the fallback

NEXT_PUBLIC_META_PIXEL_ID=809409995127436
NEXT_PUBLIC_GTM_ID=GTM-TVHD6JMG
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-YJ819KMEG3
NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT=01a0eff9-6147-7b24-954c-9cdd560623f4
NEXT_PUBLIC_RETENTION_SITE_ID=X2JHJ4WE

NEXT_PUBLIC_READER_EVENTS_ENABLED=true
NEXT_PUBLIC_READER_PROFILE_V2=true

# Staging only — delete at go-live
NEXT_PUBLIC_NOINDEX=true

# Shop (optional; code default is the Heeb Media store 303ed7-79.myshopify.com)
# NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=303ed7-79.myshopify.com

# House ads (server-only — do not prefix NEXT_PUBLIC_)
AIRTABLE_HOUSE_ADS_BASE_ID=appXFQv3Hy0wUDDnb
AIRTABLE_HOUSE_ADS_TABLE_ID=tblB3emRodWIzabTP
# AIRTABLE_API_KEY=
```

## Routes smoke-check

- `/` — latest vault issue + recent archive
- `/article/[slug]` — vault issue detail (editor intro, hero, body, rabbit hole)
- `/from-the-vault` — chronological issue list with title/dek search (`/archive` 308s here)
- `/about` — brand story
- `/profile` — reader profile / subscriptions (requires magic reader token)
- `/opted-out-comps` / `/opted-in-comps` — compilations preference confirmation
- `/ai-policy` — AI policy
- `/?poll=a` — stays on the homepage (FTV has no polls)
- `/shop` — full catalog + collection tabs (`/shop?collection=back-issues`); featured strip at the top
- `/shop/[handle]` — product page (options, live price/stock, add to cart, Product JSON-LD); unknown or hidden handle → 404
- `/products/:handle` → 308 `/shop/:handle`; `/collections/:handle` → 308 `/shop?collection=:handle` (Shopify-shaped links from old emails)
- `/article/[slug]` with an `originalIssueUrl` that is a heebmedia.com product link → "Shop this story" card for that back issue
- `/innerheebs`, `/beastieboys` (any tracker or Webflow-era slug in `legacy-slug-map.json`) → 308 `/article/innerheebs`; the pre-2026-10-07 headline slugs (`/article/the-beastie-within-…`) → 308 to the short slug; issues not yet imported → `/from-the-vault`
- `/sitemap.xml` — includes `/shop` and every visible product

---

## Launch status (2026-10-07)

Team approved 2026-10-07. Vercel env flipped the same day: `NEXT_PUBLIC_SITE_URL=https://www.heebmagazine.com` (all targets) and `NEXT_PUBLIC_NOINDEX` deleted. Cloudflare DNS (steps 3–4) and the Airtable Click URL (step 7) are done by Joseph. All absolute URLs come from `NEXT_PUBLIC_SITE_URL`, so the code is host-agnostic.

| Item | Status |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_NOINDEX` | ✅ www.heebmagazine.com / deleted (2026-10-07) |
| `NEXT_PUBLIC_GTM_ID` / `NEXT_PUBLIC_META_PIXEL_ID` | ✅ `GTM-TVHD6JMG` / `809409995127436` |
| Reader flags | ✅ |
| `SANITY_API_TOKEN` | ✅ removed from the marketing project |
| `AIRTABLE_HOUSE_ADS_*` / `AIRTABLE_API_KEY` | ✅ base/table set; key Sensitive from `Keys/AIRTABLE_HOUSEADS.txt` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ `G-YJ819KMEG3` (production + preview, 2026-09-29). Staging hits land in the same property until cutover. |
| `NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT` | ✅ `01a0eff9-6147-7b24-954c-9cdd560623f4` (production + preview, 2026-09-29). The script is published for `heebmagazine.com` only and there's no `-test` version, so no banner shows on `*.vercel.app`; the banner is verified at cutover. |
| Magic CORS | ✅ `heebmagazine.com`, `www.heebmagazine.com`, staging, heebnewsletters apex/www/`fromthevault.`, `localhost:3007` (2026-09-29) |
| Sanity CORS (`m4gmd2lf`) | ✅ both heebmagazine origins + staging |
| Vercel domains | ✅ `www.heebmagazine.com` (production), `heebmagazine.com`, `heebnewsletters.com`, `www.heebnewsletters.com`, `fromthevault.heebnewsletters.com` all attached and verified; the last four are configured as 308 → `www.heebmagazine.com`. No traffic until Cloudflare DNS points at Vercel. |
| Legacy URLs | ✅ Webflow slugs 308 to `/article/…` (host-agnostic, from `legacy-slug-map.json`); `/archive`, `/products/*`, `/collections/*` mapped |
| Shop | ✅ `/shop`, product pages, cart drawer, checkout handoff to heebmedia.com verified against the live store on staging (cart carries `source=heebmagazine.com`) |
| Hosted studio: Shop | ✅ "Shop" singleton + "Shop this story" field on issues deployed to [fromthevault.sanity.studio](https://fromthevault.sanity.studio/) |
| Magic comps / retention / cross-brand / configurable return host | ⚠️ local in `subscription-functions`; ships with the post-Oct 6 magic push |
| Airtable Destination Brands | ✅ From the Vault added to every active House Ads creative except its own |
| Hosted studio | ✅ [fromthevault.sanity.studio](https://fromthevault.sanity.studio/) (body images enabled) |
| Content | ✅ Sanity has #1–37 (#28 and #32–35 imported 2026-09-29, #36–37 on 2026-10-07, from `issues/fromthevault/` with `scripts/import-vault-issues.py`). #37 was published ahead of its send with `publishedDate` 2026-10-08T13:30Z; the site hides future-dated issues, so it appears at that time (fix the date in Studio if the send moves). Import each new issue after it sends (#38 Oct 15 onward): add its `sentAt` to `issues-catalog.json`, dry-run, then `--write --publish`. `publishedDate` is the Customer.io send time. Sanity slugs are the tracker slugs from the Issues tracker (e.g. `innerheebs`, switched from headline slugs on 2026-10-07). The importer takes them from `apps/heebnewsletters/legacy-slug-map.json` and fills in `sanitySlug` there after a published write; commit the map so `next.config.mjs` adds the 308s. New tracker issues need a row in the map before import. |
| House-ad pool + 50/50 Brand Promo split | ✅ 2026-10-06 (Heeb creatives still to come from Heeb Media) |
| Shared sign-in toast, `/sign-in`, `/redirect` | ⏳ post Oct 6 (shared packages) |

## Production host: `www.heebmagazine.com`

Decided 2026-09-29: the site launches as **Heeb Magazine** on `www.heebmagazine.com` (apex 308s to www). `heebnewsletters.com` stays the **mail and magic** domain (sender `fromthevault@heebnewsletters.com`, `email.` click-tracking, `magic.` reader APIs, MX/SPF/DMARC) and its web hosts become permanent 308s to the new site. Everything below is built and verified on staging; **only the Cloudflare DNS changes, the env flips and the Airtable formula are left, and they wait for team approval.**

### Domain table (Vercel project `heebnewsletters`, all attached + verified)

| Host | Role | Today (before DNS flip) | After DNS flip |
|------|------|-------------------------|----------------|
| `www.heebmagazine.com` | **Production** | Cloudflare zone 301s to `heebmedia.com` | Serves the site |
| `heebmagazine.com` | 308 → `www.heebmagazine.com` | Cloudflare zone 301s to `heebmedia.com` | Apex redirect (path + query preserved) |
| `heebnewsletters.com` | 308 → `www.heebmagazine.com` | Cloudflare 301 → Webflow `fromthevault.` | Redirect; magic's current return URLs land here and follow through |
| `www.heebnewsletters.com` | 308 → `www.heebmagazine.com` | Cloudflare 301 → Webflow | Redirect |
| `fromthevault.heebnewsletters.com` | 308 → `www.heebmagazine.com` | Webflow FTV site | Redirect; every old email link keeps working (`/beastieboys` → 308 host → 308 slug → `/article/…`) |
| `magic.heebnewsletters.com` | Reader APIs | Vercel `subscription-functions` | **Unchanged** |
| `email.heebnewsletters.com` | Customer.io tracking | Customer.io | **Unchanged** |

Legacy paths are handled in `apps/heebnewsletters/next.config.mjs`, host-agnostic, so they also work if someone types them on the new host: Webflow slugs from `legacy-slug-map.json` → `/article/…` (unmapped → `/from-the-vault`), `/archive` → `/from-the-vault`, `/products/:handle` → `/shop/:handle`, `/collections/:handle` → `/shop?collection=:handle`.

### Cutover checklist (team go → ~30 minutes)

Do these in order. Nothing before step 3 sends traffic to the new site.

1. **Team approval** on staging (`https://heebnewsletters.vercel.app`): home, `/from-the-vault`, an article with a "Shop this story" card, `/shop`, a product page, cart → "Checkout" (lands on heebmedia.com). Heeb Media should know carts arrive with the attribute `source=heebmagazine.com` and UTMs `utm_source=heebmagazine.com&utm_medium=referral&utm_campaign=shop`; ideally they place one real test order (or a 100% discount code) end to end.
2. **Marketing env (Vercel `heebnewsletters`, Production):** `NEXT_PUBLIC_SITE_URL=https://www.heebmagazine.com`; **delete `NEXT_PUBLIC_NOINDEX`**; add `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` if Search Console is ready. Redeploy Production. (Staging still answers on `heebnewsletters.vercel.app`; it just now canonicals to www.)
3. **Cloudflare — `heebmagazine.com` zone:** delete/disable the redirect rule (or Bulk Redirect / Page Rule) that 301s to `heebmedia.com`. Add `A heebmagazine.com → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`, both **DNS only (grey cloud)**. SSL/TLS **Full (strict)**. Do **not** touch MX, SPF or any DreamHost mail records in this zone.
4. **Cloudflare — `heebnewsletters.com` zone:** remove the 301 rule that sends the apex/www to Webflow. Point `heebnewsletters.com` (`A → 76.76.21.21`), `www` and `fromthevault` (`CNAME → cname.vercel-dns.com`) at Vercel, **DNS only**. Leave `magic`, `email`, MX, SPF, DKIM, DMARC and verification TXT records alone.
5. **Verify TLS + redirects** (Vercel issues certs within a few minutes): `curl -sI https://heebmagazine.com/ | head -3` → 308 to www; `curl -sI https://fromthevault.heebnewsletters.com/beastieboys` → 308 to `https://www.heebmagazine.com/beastieboys` → 308 to `/article/…` → 200.
6. **Webflow:** unpublish or leave the old FTV site; it no longer receives traffic. Cancel hosting when comfortable.
7. **Airtable Click URL** — paste the FTV change below and spot-check two FTV creatives.
8. **Magic (after the post-Oct 6 push):** set `BRAND_SITE_ORIGIN_HEEBNEWSLETTERS=https://www.heebmagazine.com` on `subscription-functions`, and register the `heebmagazine.com` → `heebnewsletters` brand mapping in `packages/shared-ads/brand-paths.js`. Until then the `heebnewsletters.com` 308 covers return URLs.
9. **Customer.io:** update the site links in templates for issues #36–44 (and the footer/header template) from `fromthevault.heebnewsletters.com` / `heebnewsletters.com` to `www.heebmagazine.com`. Old links keep working via 308, so this is cosmetic but should happen in the first week.
10. **Search Console / Bing:** add `www.heebmagazine.com` (domain property), submit `https://www.heebmagazine.com/sitemap.xml`. If the Webflow site was verified, add a Change of Address from it.
11. **OneTrust:** the banner is published for `heebmagazine.com`; confirm it renders on www and that GA/Meta load only after consent.
12. **Smoke list** (from `LAUNCH_PLAYBOOK.md` §7 plus the shop): `/`, `/from-the-vault`, `/article/catherineohara` (back-issue card), `/shop`, `/shop?collection=back-issues`, `/shop/heeb-12`, add to cart → drawer → checkout lands on `heebmedia.com/cart/c/…`, `/profile` sign-in via magic, `/opted-out-comps`, `/sitemap.xml`, `/robots.txt` (no `Disallow: /`), OG image on a shared link.

### Rollback

- **Within minutes:** on Cloudflare, re-enable the two redirect rules (heebmagazine → heebmedia; heebnewsletters → Webflow) and delete the DNS records added in steps 3–4. Set `NEXT_PUBLIC_NOINDEX=true` and `NEXT_PUBLIC_SITE_URL` back to staging on Vercel, redeploy. Nothing on `magic.` or mail changed, so subscriptions and sends are unaffected.
- **After Airtable formula paste:** re-add the `IF({Code} = "FTV", …)` special case.

### Airtable Click URL (FTV part, cutover day only)

Today the formula sends FTV creatives to the Webflow shape `https://fromthevault.heebnewsletters.com/{slug}`. On cutover day, point FTV at `www.heebmagazine.com/article/{slug}`. Starting from the Hipspeak formula in [`HIPSPEAK_VERCEL_ENV.md`](./HIPSPEAK_VERCEL_ENV.md):

```text
IF(
  {Ad type} = "Brand Promo",
  {Promo URL},
IF(
  {Ad type} = "House Ads",
  "https://" &
    IF({Code} = "FTV", "www.heebmagazine.com/",
      IF({Code} = "HIP", "www.", "") & {Brand} & ".com/") &
    IF(
      {Slug},
      IF({Code} = "TEC", "recipe/",
        IF({Code} = "HIP", "word/", "article/")) & {Slug}
    )
))
```

The `{Slug}` for FTV creatives is the **tracker** slug from the Issues tracker (e.g. `innerheebs`), which is also the Sanity slug, so `/article/{Slug}` is the article itself.

---

## Shop (`/shop`)

Heeb Magazine sells Heeb Media's Shopify catalog (back issues, shirts, stickers, tchotchkes) on-site; **checkout, payment, fulfilment and support stay on `heebmedia.com`**. Nothing is sold by Unaffiliated.

### How it works

- **Storefront reads** use Shopify's **tokenless Storefront API** (no access token, no Shopify admin work): `https://303ed7-79.myshopify.com/api/2026-07/graphql.json`. Code: `apps/heebnewsletters/src/lib/shopify/` (`client.js`, `queries.js`, `mappers.js`, `catalog.js`, `cart-client.js`). Catalog reads are cached 300 s (`next.revalidate`); variant price/availability on the product page is fetched live per request.
- **Tokenless limits:** products, collections, search and carts work; `totalInventory` / `quantityAvailable`, tags and metafields are **denied**. So we show "Sold out" from `availableForSale`, never a stock count. `products(query:"handle:x")` is a prefix match — exact lookups use aliased `product(handle:)`.
- **Cart** is created in the reader's browser via the Cart API and stored in `localStorage` (`heebmagazine.cartId`); the drawer re-reads it on open and recreates it if Shopify expires it. Every cart carries `attributes: [{ key: "source", value: "heebmagazine.com" }]` so Heeb Media can filter orders. "Checkout" navigates same-tab to Shopify's `checkoutUrl` with `utm_source=heebmagazine.com&utm_medium=referral&utm_campaign=shop`.
- **Checkout email step** (`CheckoutEmailModal.js`): "Checkout" in the drawer opens an "Enter your email" pop-up; a valid email is required either way. The email is set on the cart with `cartBuyerIdentityUpdate` (tokenless), so Shopify's Contact field arrives prefilled. **"Checkout and Subscribe to "From the Vault""** (Turnstile when not subscribed) goes to `magic.heebnewsletters.com/?email=…&utm_campaign=checkout&redirect&url=<base64url checkout URL>&sitename=checkout`; magic subscribes and sends the reader to `/redirect`, which forwards to Shopify after ~2 s. **"Checkout without Subscribing"** goes straight to Shopify. Already-subscribed readers see only "Continue to checkout". Shopify's own "Email me with news and offers" box is a heebmedia.com store setting, not ours.
- **Analytics** (consent-gated by OneTrust; guarded `typeof gtag/fbq`): GA4 `view_item_list`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`; Meta `ViewContent`, `AddToCart`, `InitiateCheckout`. `purchase` happens on Shopify — read it in Shopify Analytics filtered by the `source` attribute / UTM.
- **Pages:** `/shop` (tabs per collection, featured strip, ItemList JSON-LD, canonical `/shop` for all tabs), `/shop/[handle]` (`force-dynamic`, Product + AggregateOffer + Breadcrumb JSON-LD), homepage strip, About paragraph, header Shop link + cart icon (mobile: next to the hamburger), footer link, sitemap entries. Shopify-shaped `/products/*` and `/collections/*` 308 to the new URLs.
- **Articles:** when a vault issue's `originalIssueUrl` is a heebmedia.com product link, the article shows a "Shop this story" card for that back issue (badge "Back issue", note "The issue this story ran in") instead of the plain outbound link. Editors can add up to 6 more products per issue.

### Editorial controls (hosted studio → **Shop**)

`shopSettings` singleton (id `shopSettings`; the site uses code defaults until it exists):

| Field | Effect |
|-------|--------|
| `title`, `intro`, `featuredTitle` | Copy on `/shop` and the homepage strip |
| `featuredProducts[]` | Picks (with optional note) for the featured strip; falls back to the first back issues |
| `collectionTabs[]` | Explicit tab order/labels; default = every non-empty collection, Back Issues first (empty ones like a sold-out "Events" are dropped automatically) |
| `hiddenProducts[]` | Handles never shown (grid, sitemap, related); their `/shop/[handle]` 404s |
| `hideSoldOut` | Drop unavailable products from grids (default on) |

`vaultIssue.shopThisStory[]` (fieldset **Shop**) — up to 6 product picks per issue, chosen with the in-studio Shopify search (tokenless, no token to manage).

### Env

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | ⏭️ OPTIONAL — `303ed7-79.myshopify.com` is the code default |

No secret is required. If Heeb Media ever restricts tokenless access, add a public Storefront token (`NEXT_PUBLIC_*` is fine for Storefront tokens) and pass it as `X-Shopify-Storefront-Access-Token` in `client.js`.

### Smoke list

- `/shop` 200 with tabs and ≥ 40 cards; `/shop?collection=back-issues` 200; `/shop?collection=nope` 404
- `/shop/heeb-12` 200 with "Add to cart"; `/shop/chai-times` shows Color/Size chips; `/shop/not-a-product` 404
- Add a single-variant item from the grid → drawer opens with the line, count badge in the header
- "Checkout" → email pop-up; empty email is rejected by both buttons; a test address + "Checkout without Subscribing" → `https://heebmedia.com/cart/c/…?…utm_source=heebmagazine.com…` with the items present and Contact prefilled (never test "Checkout and Subscribe" with a real address)
- `/article/catherineohara` shows the HEEB #12 card; `/products/heeb-12` → 308 `/shop/heeb-12`
- `/sitemap.xml` lists `/shop` and product URLs; product page has `application/ld+json` `"@type":"Product"`
