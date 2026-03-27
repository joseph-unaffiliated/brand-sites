# Reader subscriptions API (`/api/reader-subscriptions`)

**Purpose:** Return `{ email, subscribedBrands[] }` for a **verified** reader, without accepting arbitrary email from the marketing site.

## Auth

- **Header:** `Authorization: Bearer <readerToken>`
- **`readerToken`:** HMAC token issued by `/execute` responses when **`READER_TOKEN_SECRET`** is set on the magic deploy (see `lib/reader-token.js`).

## Environments

| Variable | Required | Notes |
|----------|----------|-------|
| `READER_TOKEN_SECRET` | yes | Shared secret for sign/verify. |
| `GCP_PROJECT_ID` | yes | BigQuery project. |
| `GCP_SERVICE_ACCOUNT_KEY` | yes* | *If default credentials unavailable. |
| `READERS_CORS_ORIGINS` | recommended | Comma-separated list; profile pages `fetch` cross-origin from marketing domain to `magic.*`. |

## Methods

- `OPTIONS` — CORS preflight
- `GET` or `POST` — returns JSON body; `POST` may include `{ readerToken }` in JSON as alternative to header.

## Marketing site

Set `NEXT_PUBLIC_MAGIC_READER_API_ORIGIN` (or rely on origin derived from `NEXT_PUBLIC_MAGIC_EXECUTE_URL`). The Next app calls:

`GET ${origin}/api/reader-subscriptions` with Bearer token from `localStorage` key `magic_reader_token`.
