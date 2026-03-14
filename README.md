# Hookup Lists

Editorial site and newsletter hub for Hookup Lists.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Sanity CMS

Articles are managed in [Sanity](https://sanity.io). To connect the site:

1. **Create a Sanity project** at [sanity.io/manage](https://sanity.io/manage) (or run `npx sanity init` and follow the prompts).
2. **Add env vars**: copy `.env.local.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` — your project ID from the Sanity dashboard
   - `NEXT_PUBLIC_SANITY_DATASET` — usually `production`
3. **Run the Studio locally** (optional): install the Sanity CLI and run the studio from this repo:
   ```bash
   npm install sanity --save-dev
   npx sanity dev
   ```
   Or use the [hosted Sanity Studio](https://www.sanity.io/docs/deployment) for your project.
4. **Add content**: create an **Article** document. Set the slug (e.g. `sarah`), title, kicker, subtitle, summary, main image, entries (age / title / body), and optional disclaimer. Publish.

The app reads from Sanity at build/request time. If `NEXT_PUBLIC_SANITY_PROJECT_ID` is missing, article lists and article pages will show no content (home/archive empty; article slugs 404).
