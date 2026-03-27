# The Pickle Report setup guide (copy/paste)

This is the shortest path to launch `apps/thepicklereport` with your current setup (one shared `subscription-functions` magic backend).

## 0) Preconditions

- Repo already running as monorepo (`brand-sites`)
- `subscription-functions` project exists in Vercel
- Hookup Lists already live

---

## 1) Create the Vercel project for Pickle

1. Vercel -> **Add New Project**
2. Select repo: `brand-sites`
3. Set **Root Directory**: `apps/thepicklereport`
4. Build command: leave default (`next build`)
5. Output directory: default
6. Deploy

---

## 2) Create Pickle Sanity project

1. Go to [https://sanity.io/manage](https://sanity.io/manage)
2. Create new project for Pickle
3. Create (or use) dataset: `production`
4. Copy the **Project ID**

---

## 3) Add Vercel env vars for Pickle (copy/paste)

Vercel -> Pickle project -> **Settings -> Environment Variables**

Paste these (update placeholders):

```text
NEXT_PUBLIC_SITE_URL=https://thepicklereport.com
NEXT_PUBLIC_BRAND_ID=thepicklereport
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.hookuplists.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.hookuplists.com

NEXT_PUBLIC_SANITY_PROJECT_ID=YOUR_PICKLE_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=The Pickle Report
NEXT_PUBLIC_SITE_DESCRIPTION=YOUR_PICKLE_DESCRIPTION
NEXT_PUBLIC_SITE_OG_IMAGE=/hl-photo.png

NEXT_PUBLIC_ADSENSE_CLIENT=YOUR_ADSENSE_CLIENT
NEXT_PUBLIC_META_PIXEL_ID=YOUR_META_PIXEL_ID
```

Optional ad slots:

```text
NEXT_PUBLIC_ADSENSE_SLOT_RAIL=
NEXT_PUBLIC_ADSENSE_SLOT_MID=
NEXT_PUBLIC_ADSENSE_SLOT_BOTTOM=
```

Then click **Redeploy**.

---

## 4) Ensure shared `subscription-functions` has reader auth vars

Vercel -> `subscription-functions` -> **Settings -> Environment Variables**

### 4a) `READER_TOKEN_SECRET`

Generate and paste value:

```bash
openssl rand -hex 32
```

Set as:

```text
READER_TOKEN_SECRET=PASTE_GENERATED_VALUE
```

### 4b) `READERS_CORS_ORIGINS`

Use this combined list:

```text
https://hookuplists.com,https://www.hookuplists.com,https://thepicklereport.com,https://www.thepicklereport.com,https://the90sparent.com,https://www.the90sparent.com,https://hardresets.com,https://www.hardresets.com,http://localhost:3000,http://localhost:3001
```

Redeploy `subscription-functions` after saving.

---

## 5) Domain + DNS

Cloudflare:

- Point `thepicklereport.com` (and optionally `www`) to the Pickle Vercel project
- SSL mode: **Full (strict)**

Vercel:

- Add custom domain(s) to the Pickle project

---

## 6) Quick verification checklist

### Local

```bash
pnpm exec turbo dev --filter=thepicklereport
```

Open `http://localhost:3001` and check:

- Home loads
- `/archive` loads
- `/?subscribed=true` redirects to `/subscribed`

### Production

1. Open `https://thepicklereport.com`
2. Trigger a subscribe flow that posts to `/execute`
3. In browser DevTools:
   - Confirm `POST https://magic.hookuplists.com/execute` returns JSON (ideally includes `readerToken`)
   - Open `/profile`
   - Confirm `GET https://magic.hookuplists.com/api/reader-subscriptions` returns `200`
   - Confirm response has `Access-Control-Allow-Origin` for the Pickle origin

If profile request fails:

- Recheck `READERS_CORS_ORIGINS`
- Recheck `READER_TOKEN_SECRET`
- Redeploy `subscription-functions`

---

## 7) Optional local `.env.local` for Pickle (copy/paste)

Create `apps/thepicklereport/.env.local`:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_BRAND_ID=thepicklereport
NEXT_PUBLIC_MAGIC_EXECUTE_URL=https://magic.hookuplists.com/execute
NEXT_PUBLIC_MAGIC_READER_API_ORIGIN=https://magic.hookuplists.com

NEXT_PUBLIC_SANITY_PROJECT_ID=YOUR_PICKLE_SANITY_PROJECT_ID
NEXT_PUBLIC_SANITY_DATASET=production

NEXT_PUBLIC_SITE_DISPLAY_NAME=The Pickle Report
NEXT_PUBLIC_SITE_DESCRIPTION=YOUR_PICKLE_DESCRIPTION
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_META_PIXEL_ID=
```
