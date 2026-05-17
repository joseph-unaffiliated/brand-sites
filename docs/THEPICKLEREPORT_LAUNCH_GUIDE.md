# The Pickle Report setup guide (copy/paste)

Launch `apps/thepicklereport` with **its own** marketing site and **its own** magic host (`magic.thepicklereport.com`). Pickle does not use Hookup Lists magic or Hookup Lists Vercel env.

## 0) Preconditions

- Monorepo (`brand-sites`) builds locally
- **Two** Vercel projects (or two domains on distinct configs): marketing + magic for Pickle
- Sanity project for Pickle (`studio-the-pickle-report/`)

---

## 1) Create the Vercel project for Pickle (marketing)

1. Vercel → **Add New Project**
2. Repo: `brand-sites`
3. **Root Directory**: `apps/thepicklereport`
4. Build: default (`next build`)
5. Deploy

---

## 2) Sanity

1. [sanity.io/manage](https://sanity.io/manage) — Pickle project
2. Dataset: `production`
3. Copy **Project ID** into env (see step 3)

---

## 3) Marketing env vars

**Full paste block:** [`THEPICKLEREPORT_VERCEL_ENV.md`](./THEPICKLEREPORT_VERCEL_ENV.md) (section A).

Minimum:

```text
NEXT_PUBLIC_SITE_URL=https://thepicklereport.com
NEXT_PUBLIC_BRAND_ID=thepicklereport
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.thepicklereport.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.thepicklereport.com

NEXT_PUBLIC_SANITY_PROJECT_ID=YOUR_PICKLE_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=The Pickle Report
NEXT_PUBLIC_SITE_DESCRIPTION=YOUR_PICKLE_DESCRIPTION
NEXT_PUBLIC_SITE_OG_IMAGE=/tpr-photo.png
```

**Ads:** `NEXT_PUBLIC_ADS_MODE=cross_promo` uses Pickle image creatives by default (`NEXT_PUBLIC_SHARED_ADS_BRAND=thepicklereport`). See the Vercel env doc for slots, GTM, OneTrust, etc.

**Email → Sanity images:** `issues/thepicklereport/`, `studio-the-pickle-report/scripts/import-email-images.mjs` (needs `SANITY_API_TOKEN` locally, not on marketing Vercel).

Redeploy after saving env vars.

---

## 4) Magic Vercel project (`magic.thepicklereport.com`)

Deploy your magic/subscription-functions codebase to a **Pickle-only** Vercel project and attach `magic.thepicklereport.com`.

Env paste: [`THEPICKLEREPORT_VERCEL_ENV.md`](./THEPICKLEREPORT_VERCEL_ENV.md) (section B).

### `READER_TOKEN_SECRET`

```bash
openssl rand -hex 32
```

### `READERS_CORS_ORIGINS` (Pickle only)

```text
https://thepicklereport.com,https://www.thepicklereport.com,http://localhost:3001
```

Redeploy magic after saving.

---

## 5) Domains + DNS

**Marketing:** `thepicklereport.com` (+ optional `www`) → Pickle marketing Vercel project.

**Magic:** `magic.thepicklereport.com` → Pickle magic Vercel project.

Cloudflare SSL: **Full (strict)**.

---

## 6) Verification

### Local

```bash
pnpm exec turbo dev --filter=thepicklereport
```

`http://localhost:3001` — home, archive, `/?subscribed=true` → `/subscribed`.

### Production

1. `https://thepicklereport.com`
2. Subscribe flow → DevTools:
   - `POST https://magic.thepicklereport.com/execute` → JSON (ideally `readerToken`)
   - `/profile` → `GET https://magic.thepicklereport.com/api/reader-subscriptions` → `200`
   - Response `Access-Control-Allow-Origin` matches `https://thepicklereport.com` (or your `www` origin)

If profile fails: `READERS_CORS_ORIGINS`, `READER_TOKEN_SECRET`, redeploy **Pickle magic** (not Hookup Lists magic).

---

## 7) Local `.env.local`

See section C in [`THEPICKLEREPORT_VERCEL_ENV.md`](./THEPICKLEREPORT_VERCEL_ENV.md).

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BRAND_ID=thepicklereport
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.thepicklereport.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.thepicklereport.com
NEXT_PUBLIC_SANITY_PROJECT_ID=YOUR_PICKLE_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET=production
```
