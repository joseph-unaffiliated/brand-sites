# Hard Resets — issue structure

Captured from Issue 6 (*arrangedmarriage*): master content doc + production email HTML. Use this when modeling Sanity blocks and the future `apps/hardresets` renderer.

## What an issue is

- **Cadence:** weekly profile series (“Stories of Endings and Beginnings”)
- **One URL per issue:** `/article/{slug}` (slug from doc **SLUG** line)
- **Web vs email:** same core story; email adds masthead, forward CTA, and legal footer (not in CMS)

## Fixed sections (reading order)

| # | Section | CMS | Required |
|---|---------|-----|----------|
| 1 | Hero image + credit | `mainImage`, `photoCredit` | Yes |
| 2 | Subject name (eyebrow) | `subjectName` | Yes |
| 3 | Headline | `title` | Yes |
| 4 | Author byline | `authorName` | Yes |
| 5 | Subject icon | `subjectIcon` | Yes (brand pattern) |
| 6 | Story body | `proseSection` in `contentBlocks` | Yes |
| 7 | Secondary sources (3 links) | `secondarySourcesBlock` | Typical |

## Story body rules

- Single **`proseSection`** — do not split into multiple blocks unless the format changes later.
- **Section dividers:** paragraph containing only `*` (three story acts in Issue 6).
- **Pull quotes:** italic inline text.

## Secondary sources (email module)

Each source = two paragraphs in email:

1. **Headline** — bold, linked title sentence
2. **Description** — supporting copy + text CTA link (“Read Full Review at Vox >”)

Sanity item fields: `headline`, `description`, `ctaLabel`, `url`.

## Email-only (ignore in CMS)

- ISSUE #
- EMAIL SUBJECT LINE / PRE-HEADER
- Wordmark header, “Were you forwarded…”, footer links, unsubscribe/snooze

## Related

- [`studio-hard-resets/GOOGLE_DOC_MAPPING.md`](../studio-hard-resets/GOOGLE_DOC_MAPPING.md)
- [`studio-hard-resets/canvas-templates/hard-reset-issue-template.md`](../studio-hard-resets/canvas-templates/hard-reset-issue-template.md)
- [`NEW_PUBLICATION_ISSUE_STRUCTURE.md`](./NEW_PUBLICATION_ISSUE_STRUCTURE.md)
