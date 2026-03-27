# Magic reader token and CORS (`READER_TOKEN_SECRET`, `READERS_CORS_ORIGINS`)

For a full Pickle launch walkthrough with copy-paste values, see [`THEPICKLEREPORT_LAUNCH_GUIDE.md`](./THEPICKLEREPORT_LAUNCH_GUIDE.md).

Set these on the **Vercel project that deploys your magic host** (the same project where `/execute` and `api/magic-link.js` / `api/reader-subscriptions.js` run)—**not** on the Hookup Lists / Pickle **marketing** sites.

Path in dashboard: **Project → Settings → Environment Variables → Add** (repeat per environment: Production, Preview, Development as needed).

---

## `READER_TOKEN_SECRET`

**What it is:** A single long random string. Magic uses it to **sign** the `readerToken` field added to successful `/execute` JSON responses, and `api/reader-subscriptions` uses the same secret to **verify** that token. Anyone who knows this secret could mint tokens, so treat it like a password.

**Generate a value (pick one):**

```bash
openssl rand -hex 32
```

or

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**In Vercel:** Name = `READER_TOKEN_SECRET`, Value = paste the string (no quotes). Scope at least **Production**; add **Preview** if preview deploys should issue real reader tokens (often you only need Production).

**If unset:** `/execute` responses will **not** include `readerToken`, and the marketing profile page will only show this site’s subscription from browser storage—not the verified cross-brand list from BigQuery.

**Rotation:** If you rotate the secret, old tokens stop working until readers complete a subscribe/snooze/unsubscribe flow again (new token).

---

## `READERS_CORS_ORIGINS`

**What it is:** A **comma-separated** list of allowed **origins** (scheme + host + port, **no path**, **no trailing slash**) for browsers calling:

`GET https://magic.<brand>/api/reader-subscriptions` with `Authorization: Bearer …`.

The magic API echoes `Access-Control-Allow-Origin` only for requests whose `Origin` header is in this list (or the first entry as fallback—see `reader-subscriptions.js`).

### Suggested value for your current apps (apex + www + local dev)

Use **exactly** the origins real users hit in the browser. If you **never** serve at `www`, omit those lines.

```
https://hookuplists.com,https://www.hookuplists.com,https://thepicklereport.com,https://www.thepicklereport.com,http://localhost:3000,http://localhost:3001
```

- `3000` — default dev port for `hookuplists` (`pnpm exec turbo dev --filter=hookuplists`).
- `3001` — default dev port for `thepicklereport`.

**Production-only** (no local):

```
https://hookuplists.com,https://www.hookuplists.com,https://thepicklereport.com,https://www.thepicklereport.com
```

**Per magic deploy:** Each `magic.<brand>` Vercel project only needs origins for sites that call **that** magic host for profile. Today each marketing app uses its **own** `magicReaderApiOrigin` (e.g. HL → `magic.hookuplists.com`). So:

| Magic Vercel project | `READERS_CORS_ORIGINS` should include |
|----------------------|----------------------------------------|
| `magic.hookuplists.com` | `https://hookuplists.com`, optional `www`, optional `http://localhost:3000` |
| `magic.thepicklereport.com` | `https://thepicklereport.com`, optional `www`, optional `http://localhost:3001` |

If one magic deployment serves **multiple** brands (unusual), merge all relevant marketing origins into one comma list (still no spaces unless your parser trims—our code uses `.trim()` per segment).

### Common mistakes

- Using `https://hookuplists.com/` — **invalid** (trailing slash).
- Forgetting `http://` vs `https://` — must match what the browser sends.
- Only listing apex while users sometimes open `www` — CORS preflight fails on `www`.

---

## Quick checklist

1. Set `READER_TOKEN_SECRET` on magic Vercel (Production).
2. Set `READERS_CORS_ORIGINS` on **each** magic Vercel project to match **that** site’s real origins.
3. Redeploy magic.
4. Subscribe via a flow that hits `/execute`; confirm JSON includes `readerToken`.
5. Open **Profile** on the marketing site; network tab should show `GET …/api/reader-subscriptions` **200** with `Access-Control-Allow-Origin` matching your site.
