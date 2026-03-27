# The Pickle Report (site app)

Next.js publication in the **`brand-sites`** monorepo. Duplicate of the Hookup Lists app structure with **Pickle**-specific defaults in `src/config/site.js`.

## Before first deploy

1. Copy or replace `public/` (logos, favicon, OG image) for this brand.
2. Create a **Sanity project** for Pickle; set `NEXT_PUBLIC_SANITY_PROJECT_ID` / dataset in Vercel.
3. Point **`NEXT_PUBLIC_MAGIC_*`** at `magic.thepicklereport.com` (or your real magic host).
4. Set **Vercel Root Directory** to `apps/thepicklereport`.
5. Set display strings: `NEXT_PUBLIC_SITE_DISPLAY_NAME`, `NEXT_PUBLIC_SITE_DESCRIPTION`, optional `NEXT_PUBLIC_SITE_OG_IMAGE`, etc.

For a full copy/paste setup flow, see [`docs/THEPICKLEREPORT_LAUNCH_GUIDE.md`](../../docs/THEPICKLEREPORT_LAUNCH_GUIDE.md).
