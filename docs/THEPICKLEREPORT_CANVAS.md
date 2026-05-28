# The Pickle Report — Sanity Canvas

Canvas connects to a **hosted Studio** in your Sanity org. Pickle uses its own project (`3owmesrj`) and Studio URL: **https://thepicklereport.sanity.studio/**

**Template to paste:** `studio-the-pickle-report/canvas-templates/pickle-weekly-issue-template.md`  
After the studio appears in Canvas, save your labeled doc as an org template (document menu → **Save as template**).

## What we’ve already verified (dev side)

- Hosted Studio deploys successfully (`npm run deploy` in `studio-the-pickle-report/`)
- Schema on dataset `production` (`sanity schema deploy`)
- Manifest for Dashboard/Canvas: `https://thepicklereport.sanity.studio/static/create-manifest.json`
- `apps.canvas.enabled: true` in `sanity.config.ts`
- Same Sanity org as ’90s Parent (`oJxkxxdxr`)

If ’90s Parent appears but Pickle does not, the gap is almost always **Dashboard visibility or org app registration**, not missing `canvasApp` schema hints.

## If Pickle is missing from the Canvas “Studio” dropdown

The Studio is deployed and the schema is on the dataset (same pattern as The ’90s Parent). If you only see **The ’90s Parent**, check these in order:

### 1. Unhide the Studio in Manage (most common)

Studios can be hidden from the org Dashboard (and Canvas uses the same studio list).

1. Open [sanity.io/manage](https://www.sanity.io/manage)
2. Select project **The Pickle Report** (`3owmesrj`)
3. Open the **Studios** tab
4. Find the hosted studio (`thepicklereport.sanity.studio`)
5. Open the **⋯** menu — if you see **Show in Dashboard**, click it (the studio was hidden)
6. If you see **Hide in Dashboard**, it is already visible

Docs: [Set up and configure Dashboard — Hide a studio from Dashboard](https://www.sanity.io/docs/dashboard/dashboard-configure)

### 2. Register the studio from the org Dashboard (do this even if Manage looks fine)

Canvas lists studios that show under your org’s **Studios & Apps**, not every deployed `*.sanity.studio` URL.

1. Open [sanity.io/welcome](https://www.sanity.io/welcome) (org dashboard).
2. In the left nav, open **Studios & Apps** (or the studios list on Home).
3. Find **The Pickle Report** / `thepicklereport.sanity.studio` and **open it once** (pin it if you want).
4. Return to **Canvas**, create a **new** document, and open **Select content type** again.

If Pickle is **not** on the Studios & Apps list at all, fix step 1 (Manage → Show in Dashboard) first.

### 3. Use “Don’t see your studio?” in Canvas

In the **Select content type** modal, click **Don’t see your studio?** and add:

- **https://thepicklereport.sanity.studio**

Or open the org studio link:

- **https://www.sanity.io/@oJxkxxdxr/studio/r3ucj18bmypnyrklfqytkzaq**

### 4. Confirm you can open the Studio

Sign in at [thepicklereport.sanity.studio](https://thepicklereport.sanity.studio). If you cannot, ask an admin to add you under **Members** on the Pickle project (read access is enough to pick the studio in Canvas).

### 5. Search label in the dropdown

The entry is titled **The Pickle Report** (not `studio-the-pickle-report`). Try searching `Pickle`.

### 6. Redeploy after schema changes

From the repo:

```bash
cd studio-the-pickle-report
npm run deploy
```

Manifest (used by Dashboard/Canvas) must exist at:

`https://thepicklereport.sanity.studio/static/create-manifest.json`

## Canvas workflow (after Studio appears)

1. Content type: **Article**
2. Paste issue text from Google Doc (not PDF)
3. **Label entire document** or manual `=l` labels
4. **Send to Studio** — then finish **`contentBlocks`** in Studio (section blocks are easier to assemble there)

Field mapping reference: `studio-the-pickle-report/GOOGLE_DOC_MAPPING.md`

Sanity docs: [Configure Canvas](https://www.sanity.io/docs/canvas/configure-canvas)

### Still stuck?

Email **support@sanity.io** (or in-app help) with:

- Org: `oJxkxxdxr`
- Project: **The Pickle Report** (`3owmesrj`)
- Studio app id: `r3ucj18bmypnyrklfqytkzaq`
- Studio URL: `https://thepicklereport.sanity.studio`
- Note: ’90s Parent (`the90sparent.sanity.studio`) appears in Canvas; Pickle does not after deploy + manifest OK

**Workaround without Canvas:** edit issues directly in [thepicklereport.sanity.studio](https://thepicklereport.sanity.studio) using `GOOGLE_DOC_MAPPING.md`.
