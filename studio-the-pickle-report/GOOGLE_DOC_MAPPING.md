# Google Doc → Sanity (The Pickle Report)

Paste from Google Docs (or this repo’s `canvas-templates/pickle-weekly-issue-template.md`) into **Canvas** or **Studio**.

**Canvas:** Studio **The Pickle Report** → **Article** → label → Send to Studio → build **`contentBlocks`** in Studio.

Redeploy after schema changes: `npm run deploy` in `studio-the-pickle-report/`.

## `contentBlocks` order

1. **BODY** — `proseSection` (typical) or `listicleSection` (numbered profiles)
2. **Pickle Economics** — `pickleEconomicsSection` only (never inside prose)
3. **NIBBLES** — `nibblesBlock`
4. **SEXY PIC(KLE) OF THE WEEK** — `photoOfWeekBlock`
5. **TODAY'S / LAST WEEK'S PICKLE TRIVIA** — `pickleVoteBlock`

## Top-level fields (from issue Google Doc)

| Doc label | Sanity field | Notes |
|-----------|--------------|--------|
| SLUG | `slug` | e.g. `biggestplayers` → `/article/biggestplayers` |
| HEADLINE | `title` | |
| DEK | `subtitle` | |
| PUBLISHED ON | `publishedDate` | Also accepted: “Publishing date” |
| IMAGE | `mainImage` | Upload in Studio; doc often links to Header Image drive |
| PHOTO SOURCE | `photoCredit` | |
| AUTHOR | `authorName` | e.g. `By Rachel Manson` — strip “By ” if you prefer |
| BODY | `proseSection` / `listicleSection` | See below |

**Ignore in CMS:** ISSUE #, EMAIL SUBJECT LINE, EMAIL PRE-HEADER.

## BODY → prose or listicle

- **Prose (most issues):** One `proseSection`. Use **Heading 2** for profile lines like `Bobby Frye - CEO of Mt. Olive Pickle Co.` (Issue 19 style).
- **Listicle:** `listicleSection` — each profile = one item (`title` = name line, `body` = paragraph).

## Pickle Economics block

| Doc label | Sanity (`pickleEconomicsSection`) |
|-----------|-----------------------------------|
| PICKLE ECONOMICS TITLE | `heading` |
| GRAPH | Inline **image** in `body` (upload in Studio) |
| GRAPH INFORMATION SOURCE | Paragraph or image credit in `body` |
| GRAPH INFORMATION URL | Link in `body` |

## Nibbles block

Doc format per source:

- **Blurb:** → item `title`
- **Link:** → item `url`
- **Source:** → item `ctaLabel` (shows as link label on site)

## Sexy Pic(kle) block

| Doc label | Sanity (`photoOfWeekBlock`) |
|-----------|----------------------------|
| SEXY PIC(KLE) OF THE WEEK | `heading` (optional) + `image` |
| SEXY PIC(KLE) OF THE WEEK IMAGE SOURCE | `credit` |

## Trivia block

| Doc label | Sanity (`pickleVoteBlock`) |
|-----------|---------------------------|
| TODAY'S PICKLE TRIVIA | `question`, `options` (labels only, in order), `correctOptionCode` |
| LAST WEEK'S PICKLE TRIVIA | `lastWeek.question` (+ `lastWeek.results` when you have percents) |

**Option order:** 1st answer in the doc = **A**, 2nd = **B**, 3rd = **C**, 4th = **D**. Do not enter link codes in Studio.

**Email links:** use the article **SLUG** as `issue` and `poll=a`…`d` by position. See [`POLL_EMAIL_LINKS.md`](./POLL_EMAIL_LINKS.md).

Issue 19 example: correct answer **C (Claussen)** = 3rd option in the list.

## Canvas `.docx` layout (template merge rules)

When converting an old issue `.docx` into the Google Doc template (see `scripts/merge-pickle-issue-into-template-docx.py`):

| Area | Rule |
|------|------|
| **Drive lines** | `MAIN IMAGE`, `GRAPH`, and `SEXY PIC(KLE) OF THE WEEK` use the same parenthetical shape: `(Issue N … / All …)`. Swap in the issue’s Drive hyperlink text from the line below the image in the source doc. Do **not** add a second standalone `Issue N …` line under the header. |
| **Pickle Economics** | `GRAPH INFORMATION` bullets sit **above** the `CREDIT / COURTESY LINE` label. |
| **GRAPH INFORMATION SOURCE** | One paragraph under `CREDIT / COURTESY LINE`: comma-separated **hyperlinks**, paired in order with **GRAPH INFORMATION URL** (name → URL). |
| **PUBLISHING DATE** | Fill manually if missing from the source export (e.g. `June 10, 2026`). |
| **Spacing** | Same paragraph space after every paragraph (labels and body). |

**Ignore in CMS:** ISSUE #, EMAIL SUBJECT LINE, EMAIL PRE-HEADER (unchanged).
