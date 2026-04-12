# Deployment

## Vercel (per publication)

1. **Connect** the **`brand-sites`** Git repo.
2. **Root Directory:** `apps/hookuplists`, `apps/thepicklereport`, `apps/thekissandtell`, `apps/the90sparent`, etc. (one Vercel project per app).
3. **Production branch:** your default branch (`main` / `master`).
4. **Environment variables:** see `docs/ENVIRONMENT.md` for that app.
5. If the GitHub repo or URL changes, confirm the Vercel Git integration still points at the correct repo (re-link if needed).

## Magic (`subscription-functions-copy`)

- Deploy a **separate Vercel project** per `magic.<brand>` (or multi-domain—see plan).
- Ensure **`READER_TOKEN_SECRET`** and **`READERS_CORS_ORIGINS`** are set for profile API.
- Route **`/api/reader-subscriptions`** is provided by `api/reader-subscriptions.js` (see `subscription-functions-copy/docs/READER_SUBSCRIPTIONS_API.md`).

## Cloudflare (per brand)

- Apex / `www` **CNAME** to Vercel’s target for the **marketing** project.
- **`magic.<brand>`** CNAME to the **magic** Vercel project.
- SSL: **Full (strict)** when proxied.

## Smoke checks (per marketing deploy)

- `/` with `?subscribed=true` → `/subscribed` (middleware).
- Article listing and `/article/[slug]` load from Sanity.
- Poll / subscribed flows POST to correct `NEXT_PUBLIC_MAGIC_EXECUTE_URL`.
- Profile: with token from subscribe flow, network list loads from magic; without token, at least current brand from local state.
