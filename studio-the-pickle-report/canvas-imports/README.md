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

**Preferred:** merge each old issue into the Google Doc template (keeps labels, Drive link shape, economics layout, and hyperlinks):

```bash
python3 scripts/merge-pickle-issue-into-template-docx.py \
  --template "studio-the-pickle-report/canvas-templates/The Pickle Report - Google Doc Template.docx" \
  --issue "studio-the-pickle-report/canvas-imports/source/The Pickle Report - Issue 20.docx" \
  --output "studio-the-pickle-report/canvas-imports/output/areligiousloveofpickles.docx"
```

Rules encoded in that script (from human-edited examples) are summarized in [`GOOGLE_DOC_MAPPING.md`](../GOOGLE_DOC_MAPPING.md#canvas-docx-layout-template-merge-rules).

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

## Asking the agent

Add `.docx` files to `source/`, then:

*“Merge everything in `canvas-imports/source/` into the template and write `.docx` files to `output/`.”*

Do **not** ask for `.md` output if you need links preserved.
