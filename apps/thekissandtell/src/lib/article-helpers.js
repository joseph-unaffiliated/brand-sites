/**
 * Strip leading "Age N. ... . " from summary text so description never repeats demographic.
 */
export function ensureDescriptionOnly(text) {
  if (!text || typeof text !== "string") return text;
  const idx = text.indexOf(" From ");
  if (idx > 0) return text.slice(idx + 1).trim();
  return text;
}

/**
 * Remove leading text when it duplicates `prefix` (e.g. subtitle already shown as dek/demographic).
 * Handles first-line-only repeats and same-paragraph repeats.
 */
export function stripLeadingDuplicate(text, prefix) {
  if (!text?.trim() || !prefix?.trim()) return text;
  const p = prefix.trim();
  let t = text.trim();

  const lines = t.split(/\r?\n/);
  const firstLine = lines[0]?.trim() ?? "";
  if (firstLine && firstLine.toLowerCase() === p.toLowerCase()) {
    const rest = lines.slice(1).join("\n").trim();
    return rest.length > 0 ? rest : "";
  }

  if (t.toLowerCase().startsWith(p.toLowerCase())) {
    let rest = t.slice(p.length).trim();
    rest = rest.replace(/^[\s.!?]+/, "").trim();
    return rest.length > 0 ? rest : "";
  }

  return text;
}

function dedupeDescriptionVsDemographic(demographic, description) {
  if (!description?.trim()) return description;
  let d = stripLeadingDuplicate(description.trim(), demographic);
  if (
    demographic &&
    d.trim().toLowerCase() === demographic.trim().toLowerCase()
  ) {
    return "";
  }
  return d;
}

/**
 * Split article into demographic line (Age X. Gender. Orientation.) and description.
 */
export function getDemographicAndDescription(article) {
  const subtitle = (article?.subtitle || "").trim();
  const summary = (article?.summary || "").trim();
  if (subtitle && summary) {
    let description = ensureDescriptionOnly(summary);
    description = dedupeDescriptionVsDemographic(subtitle, description);
    return {
      demographic: subtitle,
      description,
    };
  }
  if (summary) {
    const fromMatch = summary.match(/\s+From\s+/);
    if (fromMatch) {
      const i = summary.indexOf(fromMatch[0]);
      const demographic = summary.slice(0, i).trim();
      let description = summary.slice(i).trim();
      description = dedupeDescriptionVsDemographic(demographic, description);
      return {
        demographic,
        description,
      };
    }
    let description = ensureDescriptionOnly(summary);
    description = dedupeDescriptionVsDemographic(subtitle, description);
    return { demographic: "", description };
  }
  return { demographic: subtitle, description: "" };
}

function portableTextBlockToPlainText(block) {
  if (!block || block._type !== "block") return "";
  return (block.children || []).map((c) => c?.text || "").join("");
}

function replaceFirstBlockText(block, newText) {
  const ch = block.children;
  if (!ch?.length) {
    return {
      ...block,
      children: [{ _type: "span", _key: "span-0", text: newText, marks: [] }],
    };
  }
  return {
    ...block,
    children: [{ ...ch[0], text: newText }, ...ch.slice(1)],
  };
}

function stripSubtitleFromPortableBody(body, subtitle) {
  if (!Array.isArray(body) || body.length === 0) return body;
  const first = body[0];
  if (first._type !== "block") return body;
  const fullText = portableTextBlockToPlainText(first);
  const stripped = stripLeadingDuplicate(fullText, subtitle);
  if (stripped === fullText) return body;
  if (!stripped.trim()) return body.slice(1);
  return [replaceFirstBlockText(first, stripped), ...body.slice(1)];
}

function headingsMatchHero(a, b) {
  if (!a?.trim() || !b?.trim()) return false;
  const norm = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");
  return norm(a) === norm(b);
}

/**
 * Remove hero duplicates from the first prose section: subtitle at the start of body, and
 * section `heading` when it repeats the article title (H1 is already shown above).
 *
 * @param {string} [title] — when set, clears the first matching `heading` on proseSection / listicleSection / nibblesBlock
 */
export function dedupeSubtitleInContentBlocks(blocks, subtitle, title) {
  if (!Array.isArray(blocks) || blocks.length === 0) return blocks;
  const sub = subtitle?.trim();
  const heroTitle = title?.trim();
  let appliedSubtitle = false;
  let appliedHeading = false;

  return blocks.map((block) => {
    let next = block;

    if (
      !appliedSubtitle &&
      sub &&
      (block?._type === "proseSection" || block?._type === "pickleEconomicsSection") &&
      Array.isArray(block.body)
    ) {
      const newBody = stripSubtitleFromPortableBody(block.body, sub);
      if (newBody !== block.body) {
        appliedSubtitle = true;
        next = { ...block, body: newBody };
      }
    }

    if (!appliedHeading && heroTitle && next && typeof next.heading === "string") {
      if (headingsMatchHero(next.heading, heroTitle)) {
        appliedHeading = true;
        next = { ...next, heading: undefined };
      }
    }

    return next;
  });
}
