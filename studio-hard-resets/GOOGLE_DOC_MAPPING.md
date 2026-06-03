# Master content doc → Sanity (Hard Resets)

Paste from the **Hard Resets master content doc** (or `canvas-templates/hard-reset-issue-template.md`) into **Canvas** or edit directly in **Studio**.

**Canvas:** Studio **Hard Resets** → **Article** → label fields → **Send to Studio** → add **`contentBlocks`** (story + secondary sources) if Canvas did not create them.

Redeploy after schema changes: `npm run deploy` in `studio-hard-resets/`.

## Issue anatomy (web + email)

```text
Hero image + credit → Subject name → Headline → Author → Icon → Story (CONTENT) → Secondary sources
```

Email-only chrome (wordmark, footer, subscribe CTA) is **not** in Sanity.

## `contentBlocks` order

1. **CONTENT** — `proseSection` (one block; `*` paragraphs = section dividers)
2. **SECONDARY SOURCES** — `secondarySourcesBlock`

## Top-level fields

| Doc label | Sanity field | Notes |
|-----------|--------------|--------|
| SLUG | `slug` | e.g. `arrangedmarriage` → `/article/arrangedmarriage` |
| SUBJECT NAME | `subjectName` | Profile subject above headline (e.g. Fraidy Reiss) |
| HEADLINE | `title` | |
| IMAGE | `mainImage` | Upload in Studio; Drive links in the doc are references only |
| PHOTO CREDIT | `photoCredit` | Plain text or “Photo Credit: …” |
| AUTHOR | `authorName` | |
| ICON | `subjectIcon` | Small icon image; upload in Studio |

**Ignore in CMS:** ISSUE #, EMAIL SUBJECT LINE, EMAIL PRE-HEADER (Customer.io).

## CONTENT → `proseSection`

- Paste the full narrative under **CONTENT** into one **`proseSection`** body.
- **Section breaks:** standalone paragraph containing only `*` (matches centered asterisk in email).
- **Pull quotes:** italicize quoted dialogue in the doc (email uses `<em>`).
- Do **not** put secondary sources inside prose — they get their own block.

## SECONDARY SOURCES → `secondarySourcesBlock`

Preferred doc shape (expanded — matches email HTML):

| Doc label | Sanity (`secondarySourcesItem`) |
|-----------|--------------------------------|
| HEADLINE | `headline` |
| DESCRIPTION | `description` |
| LINK | `url` |
| CTA LABEL | `ctaLabel` |

Legacy nested bullets (still supported when labeling manually):

| Legacy label | Maps to |
|--------------|---------|
| Blurb | `headline` (bold hook line) |
| Link | `url` |
| Source | `ctaLabel` (e.g. “Read Full Review at Vox”, not just “Vox”) |

If you only have one blurb line and no DESCRIPTION, put the full first paragraph in **HEADLINE** and leave **DESCRIPTION** blank.

## Canvas workflow checklist

1. Create Sanity project; set `projectId` in `sanity.config.ts` / `sanity.cli.ts`; `npm run deploy`.
2. Canvas → **Hard Resets** → **Article**.
3. Paste labeled doc → **Label entire document** (or `=l` per section).
4. **Send to Studio**.
5. Upload **IMAGE** and **ICON** assets (Canvas cannot ingest Google Drive URLs).
6. Confirm **`contentBlocks`**: Story + Secondary sources with three items.
7. Publish.

## Import script note

Use document IDs **without dots** (e.g. `arrangedmarriage`, not `article.arrangedmarriage`). Dotted IDs are private paths in Sanity and are invisible to the public API unless `SANITY_API_TOKEN` is set on the marketing app.


See `canvas-templates/hard-reset-issue-template.md` — derived from the production email HTML and master content doc.
