# Hard Resets — Sanity Canvas

Canvas connects to a **hosted Studio** in your Sanity org. Hard Resets uses its own project and Studio URL: **https://hardresets.sanity.studio/** (after deploy).

**Template to paste:** `studio-hard-resets/canvas-templates/hard-reset-issue-template.md`  
After the studio appears in Canvas, save your labeled doc as an org template (document menu → **Save as template**).

## Prerequisites

1. Sanity project created; `YOUR_SANITY_PROJECT_ID` replaced in `studio-hard-resets/sanity.config.ts` and `sanity.cli.ts`.
2. `cd studio-hard-resets && npm install && npm run deploy`
3. Same Sanity org as other Unaffiliated publications (e.g. `oJxkxxdxr`).

## Canvas workflow

1. Content type: **Article**
2. Paste issue text from the master content doc (Markdown labels — not PDF)
3. **Label entire document** or manual `=l` labels
4. **Send to Studio**
5. Upload **IMAGE** and **ICON** (Drive links in the doc are not auto-imported)
6. Verify **`contentBlocks`**: one **Story** (`proseSection`) + **Secondary sources** (`secondarySourcesBlock`)

Field mapping: [`studio-hard-resets/GOOGLE_DOC_MAPPING.md`](../studio-hard-resets/GOOGLE_DOC_MAPPING.md)

## If Hard Resets is missing from the Canvas studio dropdown

Same fixes as Pickle — see [`THEPICKLEREPORT_CANVAS.md`](./THEPICKLEREPORT_CANVAS.md):

1. Manage → Hard Resets project → Studios → **Show in Dashboard**
2. [sanity.io/welcome](https://www.sanity.io/welcome) → **Studios & Apps** → open **Hard Resets** once
3. Canvas → **Don't see your studio?** → `https://hardresets.sanity.studio`

## Issue structure reference

See [`HARDRESETS_ISSUE_STRUCTURE.md`](./HARDRESETS_ISSUE_STRUCTURE.md) for how the master doc maps to email HTML and the web article.

Sanity docs: [Configure Canvas](https://www.sanity.io/docs/canvas/configure-canvas)
