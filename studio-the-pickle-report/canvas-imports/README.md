# Canvas issue conversion (The Pickle Report)

Use this folder when you have **old issue Google Docs** and want files ready for **Sanity Canvas** with **links and formatting intact**.

## Important: use `.docx`, not `.md`

Markdown conversion **drops inline hyperlinks** and breaks spacing. Always work from **Word / Google Doc exports** (`.docx`).

| Folder | Purpose |
|--------|---------|
| [`../canvas-templates/pickle-weekly-issue-template.md`](../canvas-templates/pickle-weekly-issue-template.md) | Label reference (text). Prefer saving your working issue as **`model/pickle-weekly-issue-template.docx`** (see below). |
| `model/` | Drop your **golden template** `.docx` here (export from Google Docs once). |
| `source/` | **Drop old issues here** — one `.docx` per issue. |
| `output/` | **Generated `.docx`** files — paste into Canvas or open in Google Docs first. |

## Convert issues to output `.docx`

**Batch (all issues in manifest):**

```bash
python3 scripts/merge-pickle-issue-into-template-docx.py \
  --batch \
  --template "studio-the-pickle-report/canvas-templates/The Pickle Report - Google Doc Template.docx" \
  --manifest studio-the-pickle-report/canvas-imports/issues-manifest.json \
  --output-dir studio-the-pickle-report/canvas-imports/output \
  --report studio-the-pickle-report/canvas-imports/batch-report.json
```

[`issues-manifest.json`](issues-manifest.json) maps each issue number to a `source/` filename and CSV metadata (`releaseDate`, `fullName`, `slug`). Issue 19 (`biggestplayers`) is copied from the template (no merge). Add or rename source files in the manifest only.

**Email HTML (Customer.io exports):** Drop `template-*.html` files (or `…/index.html` folders) in `source/`. The batch run auto-matches them to issues by headline vs `fullName` in the manifest, then merges **Nibbles**, **Sexy Pic**, **Trivia/Poll**, **Pickle Economics**, and image URLs from the email into the Canvas docx. Google Doc `.docx` sources are still used for prose when they are longer.

**Single issue:**

```bash
python3 scripts/merge-pickle-issue-into-template-docx.py \
  --template "studio-the-pickle-report/canvas-templates/The Pickle Report - Google Doc Template.docx" \
  --issue "studio-the-pickle-report/canvas-imports/source/The Pickle Report - Issue 20.docx" \
  --output "studio-the-pickle-report/canvas-imports/output/areligiousloveofpickles.docx"
```

### Source format tiers

| Tier | Issues (approx.) | Format |
|------|------------------|--------|
| Modern | 20–23 | `SLUG`, `HEADLINE`, `BODY`, labeled blocks |
| Transitional | 9–18, 22 | `Headline:` / `Dek:` / emoji section headers |
| Legacy | 1–8 | Transitional + `SPONSOR`, `LINKS`, etc. (dropped) |

Early issues may omit Nibbles, Trivia, or Pickle Economics; the merge leaves those template slots empty. Legacy-only sections are not copied to the site.

Rules encoded in the merge script are summarized in [`GOOGLE_DOC_MAPPING.md`](../GOOGLE_DOC_MAPPING.md#canvas-docx-layout-template-merge-rules).

**Legacy:** label-rename only (no template merge):

```bash
python3 scripts/convert-pickle-issue-to-canvas-docx.py \
  --input "studio-the-pickle-report/canvas-imports/source/The Pickle Report - Issue 20.docx" \
  --output studio-the-pickle-report/canvas-imports/output/areligiousloveofpickles.docx
```

## Canvas workflow

1. Open `output/<slug>.docx` in Word or upload to Google Docs.
2. Copy all → paste into **Sanity Canvas** (Article).
3. **Label entire document** → **Send to Studio**.
4. Upload images in Studio (header, graph, sexy pic) if the doc only has Drive placeholders.
5. Add **`contentBlocks`** in Studio if needed — see [`GOOGLE_DOC_MAPPING.md`](../GOOGLE_DOC_MAPPING.md).

## Model template as `.docx`

Save your working Issue 19 (or latest) Google Doc as:

`studio-the-pickle-report/canvas-imports/model/pickle-weekly-issue-template.docx`

That becomes the visual reference for new issues. The `.md` in `canvas-templates/` is the same labels in plain text only.

## Example

| Source | Output |
|--------|--------|
| `source/The Pickle Report - Issue 20.docx` | `output/areligiousloveofpickles.docx` |

## Sync existing Sanity drafts (issues 1–10)

When drafts already exist in Studio with long Canvas slugs, use the email + manifest payload to patch them in place (short `slug`, `publishedDate`, prose cleanup, `nibblesBlock`, `pickleVoteBlock`, images):

```bash
node studio-the-pickle-report/scripts/sync-issue-drafts.mjs --issues=1-10
```

**Create new drafts** (issues 11–18, 21–23 — skips 19–20, which are already published):

```bash
node studio-the-pickle-report/scripts/create-issue-articles.mjs
```

Requires `SANITY_API_TOKEN` in `apps/thepicklereport/.env.local`. Payload is built by `scripts/email-issue-sanity-payload.py` from `source/` email HTML + `issues-manifest.json`. Inventory snapshot: [`sanity-articles.json`](sanity-articles.json).

## Asking the agent

Add `.docx` files to `source/`, update `issues-manifest.json` if filenames change, then run the **batch** command above.

Do **not** ask for `.md` output if you need links preserved.
