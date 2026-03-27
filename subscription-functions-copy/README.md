# subscription-functions (reference / deploy)

Serverless functions for **magic links**, **BigQuery**, **Customer.io**, and related automation. Deployed to **`magic.<brand>.com`**.

**Reader profile API:** When `READER_TOKEN_SECRET` is set, `/execute` responses may include `readerToken`; clients call **`/api/reader-subscriptions`** with `Authorization: Bearer …`. See [docs/READER_SUBSCRIPTIONS_API.md](docs/READER_SUBSCRIPTIONS_API.md).

Marketing Next apps live in the parent monorepo under **`apps/*`**; they do **not** import this package.

**More documentation:** see the [`docs/`](docs/) folder (deployment, CSV guides, CIO, Meta lead ads, etc.).
