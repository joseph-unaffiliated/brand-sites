# The Eyeballer's Cookbook — Sanity Studio

Content studio for [theeyeballerscookbook.com](https://theeyeballerscookbook.com). One `recipe` document per weekly email issue, plus a `category` taxonomy for browsing.

## First-time setup

1. Create a new Sanity project at [sanity.io/manage](https://www.sanity.io/manage) (org: same as the other publications). Name it **The Eyeballer's Cookbook**, dataset `production`.
2. Replace `YOUR_SANITY_PROJECT_ID` in `sanity.config.ts` and `sanity.cli.ts` with the new project id.
3. `npm install`, then `npm run dev` to run locally.
4. `npx sanity deploy` — choose host `theeyeballerscookbook` (studio at theeyeballerscookbook.sanity.studio). Add the printed `appId` to `sanity.cli.ts` under `deployment`.
5. Set `NEXT_PUBLIC_SANITY_PROJECT_ID` on the Vercel project for `apps/theeyeballerscookbook`.
6. In sanity.io/manage → API → CORS origins, add `http://localhost:3005` and `https://theeyeballerscookbook.com`.

## Content model

- **recipe** — mirrors the weekly email exactly: title, hero image, equipment line ("What you'll need: … also:"), plain-string ingredients (no quantities — the brand is *Recipes Without Measurements*), ordered plain-text steps, author credit + bio, "Did you know…" fun fact, and "What else?" external links. Plus editorial extras the emails don't have: `category` reference, optional `description` for cards/SEO, `issueNumber`, and a collapsed SEO fieldset.
- **category** — title, slug, description, sortOrder. Assign from each recipe; the site only shows categories that contain recipes.

There are intentionally **no** prep/cook time, servings, difficulty, or structured quantity fields — the source emails don't have that data and the brand voice avoids it.
