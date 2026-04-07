# New publication: what to define about **issue structure** (before building the CMS)

This guide is for **editors / publication owners** and for **developers or AI agents** wiring a new brand into `brand-sites`. The goal is to capture **repeatable issue anatomy** up front so we model **Sanity content blocks**, **frontend rendering**, and **import scripts** once—instead of retrofitting (splitting prose, new block types, migrations) after launch.

Use this as a **checklist conversation**: answers can be short bullets or a single sample issue outline.

---

## 1. What an “issue” is

- **Cadence**: weekly, biweekly, ad hoc?
- **One URL per issue** (e.g. `/article/slug`) vs hub page—confirm routing expectations.
- **Relationship to email**: Is the web issue the **same** content as the newsletter, an excerpt, or expanded? (Drives duplicate-stripping, CTAs, and how strictly blocks must mirror email HTML.)

---

## 2. Fixed sections (recurring modules)

List every **named section** that appears in **most** issues, in **reading order**.

For each section, specify:

| Question | Why it matters |
|----------|----------------|
| **Stable label** (e.g. “Pickle Economics”, “Today’s Pickle Trivia”) | Studio list types, `aria-label`, analytics. |
| **Always its own block in the CMS, or embedded in prose?** | First-class `contentBlocks` types vs portable text—avoid stuffing structured modules inside a single Prose section. |
| **Heading level / style** (eyebrow vs H2 vs body) | Matches existing components (`blockHeading`, `photoOfWeekTitle`, `eyebrow`, etc.) or needs new styles. |
| **Typical body** (short copy, long essay, image + caption, chart, poll options) | Schema: `body` as portable text vs dedicated fields (`question`, `options[]`, image asset). |
| **Optional vs required** | Validation rules and empty states. |
| **Order relative to other sections** (e.g. always before poll, always last) | Stored `contentBlocks` order vs client-side reorder (e.g. “photo of week last” hacks). |

**Retrofit lesson:** If a module is **conceptually** its own section but was authored **inside** a long Prose block (inline markers, headings only in paragraph text), we pay migration cost. Prefer **one block type per recurring section** from day one.

---

## 3. Prose vs structured blocks

- **What belongs in generic “Prose”** (intro, essay, letter from the editor)?
- **What must never be only in Prose** (polls, charts, sponsored modules, legal disclaimers)?

Provide **one example** of a “full issue” outline (headings only is fine), e.g.:

```text
Intro prose → Pickle Economics → Photo of the Week → Poll → Nibbles → Footer disclaimer
```

---

## 4. Portable text rules

- **Inline images** in body copy: yes/no? (Schema must allow `image` in the portable-text `of` array; frontend must register `components.types.image`.)
- **Section divider lines** in Sanity (e.g. a paragraph that is only `💡 Section Name`): fragile for validation and migration—prefer **separate blocks** or a dedicated small type.
- **Bold/italic/links** only, or also **footnotes, tables, embeds**?

---

## 5. Assets and ads

- **Rail / sticky / in-article** ad slots: IAB sizes, which env vars (`NEXT_PUBLIC_*`) map to which placement?
- **Cross-promo vs AdSense** per placement?
- **Shared creatives** (`@publication-websites/shared-ads`) vs brand-only assets?

(Aligns with `docs/ENVIRONMENT.md` and per-app ad config—not issue structure only, but affects layout around content blocks.)

---

## 6. What to hand to engineering

Minimum useful package:

1. **Section list** (section 2 table) with order.
2. **One sample issue** (Google Doc, exported HTML, or Sanity JSON export) showing real structure.
3. **Explicit callout**: “These N sections are **not** optional prose—they get their own block types.”
4. **Exceptions**: “Issue 1 had X; ignore for schema.”

---

## 7. Post-launch changes

If recurring sections move **into** or **out of** Prose after launch, expect:

- Sanity schema + Studio deploy
- GROQ projections in `packages/sanity-content`
- App renderers (`ArticleContentBlocks` or equivalent)
- Optional **migration scripts** (dataset patches) and **backward compatibility** in the renderer until content is migrated

Documenting structure early (this file) reduces but does not eliminate that work when the product changes.

---

## Related docs

- [ENVIRONMENT.md](./ENVIRONMENT.md) — env vars and deployments  
- [ARCHITECTURE.md](./ARCHITECTURE.md) — high-level system  
- [DEPLOYMENT.md](./DEPLOYMENT.md) — deploy topology  
- [AGENTS.md](../AGENTS.md) — monorepo rules for new publications  
