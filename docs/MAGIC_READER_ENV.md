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

**One shared magic project:** every `magic.<brand>` host is served by the **same** Vercel project (`subscription-functions`), so `READERS_CORS_ORIGINS` is **one network-wide list** containing every brand's origins. Each marketing app still calls its **own** magic host (e.g. HL → `magic.hookuplists.com`), but they all read this one variable. When adding a brand, **append** its origins and keep every existing one. An unlisted origin gets the first entry echoed back, so the browser blocks the response and profile/favorites silently fail. That happened to TEC until 2026-09-28.

| Brand | Origins that must be in the shared list |
|-------|------------------------------------------|
| Hookup Lists | `https://hookuplists.com`, `https://www.hookuplists.com`, `http://localhost:3000` |
| The Pickle Report | `https://thepicklereport.com`, `https://www.thepicklereport.com`, `http://localhost:3001` |
| Hard Resets | `https://hardresets.com`, `https://www.hardresets.com`, `http://localhost:3004` — see [`HARDRESETS_VERCEL_ENV.md`](./HARDRESETS_VERCEL_ENV.md) |
| The Eyeballer's Cookbook | `https://theeyeballerscookbook.com`, `https://www.theeyeballerscookbook.com` |
| Hipspeak | `https://hipspeak.com`, `https://www.hipspeak.com`, `https://hipspeak.vercel.app`, `http://localhost:3006` |
| From the Vault, by Heeb | `https://heebnewsletters.vercel.app`, `https://heebnewsletters.com`, `https://www.heebnewsletters.com`, `https://fromthevault.heebnewsletters.com`, `http://localhost:3007` |

Other live brands (TNP, TKT) follow the same apex + www pattern. Verify each origin after any change with a preflight probe; the response must echo the same origin:

```bash
curl -s -o /dev/null -D - -X OPTIONS \
  -H "Origin: https://www.hipspeak.com" -H "Access-Control-Request-Method: GET" \
  https://magic.hipspeak.com/api/reader-subscriptions | grep -i access-control-allow-origin
```

Pickle copy/paste env: [`THEPICKLEREPORT_VERCEL_ENV.md`](./THEPICKLEREPORT_VERCEL_ENV.md). The list is comma-separated; the code trims each segment.

### Common mistakes

- Using `https://hookuplists.com/` — **invalid** (trailing slash).
- Forgetting `http://` vs `https://` — must match what the browser sends.
- Only listing apex while users sometimes open `www` — CORS preflight fails on `www`.

---

## Quick checklist

1. Set `READER_TOKEN_SECRET` on magic Vercel (Production).
2. Append the brand's real origins to the shared `READERS_CORS_ORIGINS` on the magic Vercel project (keep every existing origin).
3. Redeploy magic.
4. Subscribe via a flow that hits `/execute`; confirm JSON includes `readerToken`.
5. Open **Profile** on the marketing site; network tab should show `GET …/api/reader-subscriptions` **200** with `Access-Control-Allow-Origin` matching your site.
