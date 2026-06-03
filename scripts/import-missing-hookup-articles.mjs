#!/usr/bin/env node
/**
 * Import missing Hook Up List articles from Customer.io HTML exports into Sanity.
 *
 * Usage (from repo root):
 *   node scripts/import-missing-hookup-articles.mjs [--dry-run]
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, extname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const brandExplainer =
  "Hookup Lists is a weekly chronicle of the highlights (and lowlights) from one person's actual hookup history.";
const disclaimer =
  "Disclaimer: All names and identifiable details have been modified to protect the reputions of our contributors in the eyes of their partners, colleagues, and parents.";

const ARTICLES = [
  { slug: "rebecca", file: "/Users/joseph/Downloads/template-133.html" },
  { slug: "gordon", file: "/Users/joseph/Downloads/template-134.html" },
  { slug: "april", file: "/Users/joseph/Downloads/template-135.html" },
  { slug: "brandon", file: "/Users/joseph/Downloads/template-136.html" },
  { slug: "brooke", file: "/Users/joseph/Downloads/template-149.html" },
  { slug: "carrie", file: "/Users/joseph/Downloads/template-113.html" },
  { slug: "derek", file: "/Users/joseph/Downloads/index.html" },
  { slug: "heather", file: "/Users/joseph/Downloads/template-150.html" },
  { slug: "kayla", file: "/Users/joseph/Downloads/template-146.html" },
  { slug: "maya", file: "/Users/joseph/Downloads/template-147.html" },
  { slug: "natalie", file: "/Users/joseph/Downloads/template-148.html" },
  { slug: "ollie", file: "/Users/joseph/Downloads/template-131.html" },
];

const DRY_RUN = process.argv.includes("--dry-run");

function loadEnvLocal() {
  const appPath = join(root, "apps/hookuplists/.env.local");
  const path = existsSync(appPath) ? appPath : join(root, ".env.local");
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function decodeEntities(text = "") {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<br\s*\/?>/gi, "\n");
}

function stripTags(text = "") {
  return decodeEntities(text)
    .replace(/<[^>]*>/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanText(text = "") {
  return stripTags(text).replace(/\s{2,}/g, " ").trim();
}

function normalizeAge(age) {
  return age.replace(/^Age\s*:\s*/i, "Age ").replace(/\s+/g, " ").trim();
}

function normalizeSubtitle(subtitle) {
  return subtitle
    .replace(/^Age\s*:\s*/i, "Age ")
    .replace(/\.\s*$/, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function isBrandImageUrl(url = "") {
  try {
    const d = decodeURIComponent(url).toLowerCase();
    return /wordmark|logo\s*white|hl\s*-\s*logo|hl\s*-\s*wordmark/.test(d);
  } catch {
    return false;
  }
}

function buildSummary(subtitle, entries) {
  if (!entries.length) return subtitle;
  const first = entries[0].title.toLowerCase();
  const last = entries[entries.length - 1].title.toLowerCase();
  const lead = last.startsWith("the ") ? `the ${last.slice(4)}` : last;
  return `${subtitle}. From ${first} to ${lead}.`;
}

function extractSubjectName(headline) {
  const normalized = headline.replace(/[\u2018\u2019]/g, "'");
  const m = normalized.match(/^(.+?)'s\s+(?:Hook\s*Up\s*)?List$/i);
  if (m) return m[1].trim();
  return normalized.replace(/'s\s+(?:Hook\s*Up\s*)?List$/i, "").trim();
}

function parseHookupListHtml(html) {
  const quickiesIdx = html.search(/Quickies\s*:/i);
  const storyHtml = quickiesIdx >= 0 ? html.slice(0, quickiesIdx) : html;

  const headlineMatch =
    storyHtml.match(/<h2[^>]*font-size:\s*56px[^>]*>([\s\S]*?)<\/h2>/i) ||
    storyHtml.match(/<h2[^>]*>([^<]*(?:Hook\s*Up\s*)?List)<\/h2>/i);
  const headline = cleanText(headlineMatch?.[1] ?? "");
  const subjectName = extractSubjectName(headline);

  const subtitleMatch = storyHtml.match(
    /<h2[^>]*(?:56px|List)[\s\S]*?<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i
  );
  const subtitle = normalizeSubtitle(cleanText(subtitleMatch?.[1] ?? ""));

  const photoMatch = html.match(/>(Photo (?:by|provided by) [^<]+)</i);
  const photoCredit = photoMatch ? cleanText(photoMatch[1]) : "";

  const imageUrls = [...html.matchAll(/src="(https:\/\/userimg-assets\.customeriomail\.com[^"]+)"/gi)].map(
    (m) => m[1]
  );
  const mainImageUrl = imageUrls.find((u) => !isBrandImageUrl(u)) || "";

  const entries = [];
  const ageRegex = /<p[^>]*font-size:\s*11px[^>]*>([\s\S]*?)<\/p>/gi;
  let ageMatch;
  const agePositions = [];

  while ((ageMatch = ageRegex.exec(storyHtml)) !== null) {
    const ageText = normalizeAge(cleanText(ageMatch[1]));
    if (!/^Age\s+\d+/i.test(ageText)) continue;
    agePositions.push({ index: ageMatch.index, age: ageText });
  }

  for (let i = 0; i < agePositions.length; i++) {
    const start = agePositions[i].index;
    const end = i + 1 < agePositions.length ? agePositions[i + 1].index : storyHtml.length;
    const block = storyHtml.slice(start, end);

    const titleMatch =
      block.match(/<(?:h2|p)[^>]*font-size:\s*24px[^>]*text-align:\s*left[^>]*>([\s\S]*?)<\/(?:h2|p)>/i) ||
      block.match(/<(?:h2|p)[^>]*font-size:\s*24px[^>]*>([\s\S]*?)<\/(?:h2|p)>/i);
    const bodyMatch = block.match(/<p[^>]*font-size:\s*15px[^>]*>([\s\S]*?)<\/p>/i);

    const title = cleanText(titleMatch?.[1] ?? "");
    const body = cleanText(bodyMatch?.[1] ?? "");

    if (!title || !body) continue;
    if (/^today'?s poll$/i.test(title) || title.endsWith("?")) continue;
    if (/pickle report|thepicklereport/i.test(body) || /thepicklereport\.com/i.test(block)) continue;

    entries.push({
      _type: "articleEntry",
      age: agePositions[i].age,
      title,
      body,
    });
  }

  return {
    headline,
    subjectName,
    subtitle,
    photoCredit,
    mainImageUrl,
    entries,
    summary: buildSummary(subtitle, entries),
  };
}

function getImageExtFromUrl(url) {
  try {
    const ext = extname(new URL(url).pathname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) return ext;
  } catch {
    /* ignore */
  }
  return ".jpg";
}

async function uploadImageFromUrl({ projectId, dataset, token, imageUrl, filenameBase }) {
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Image fetch failed (${imageResponse.status}): ${imageUrl}`);
  }

  const contentType = imageResponse.headers.get("content-type") || "application/octet-stream";
  const buffer = await imageResponse.arrayBuffer();
  if (!buffer.byteLength) throw new Error(`Empty image: ${imageUrl}`);

  const ext = getImageExtFromUrl(imageUrl);
  const filename = `${filenameBase}${ext}`;
  const uploadUrl = `https://${projectId}.api.sanity.io/v2024-01-01/assets/images/${dataset}?filename=${encodeURIComponent(filename)}`;

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: Buffer.from(buffer),
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload failed (${uploadResponse.status}): ${await uploadResponse.text()}`);
  }

  const data = await uploadResponse.json();
  if (!data?.document?._id) throw new Error(`No asset id for ${imageUrl}`);

  return {
    _type: "image",
    asset: { _type: "reference", _ref: data.document._id },
  };
}

async function fetchExistingSlugs(projectId, dataset, token) {
  const query = encodeURIComponent('*[_type == "article"].slug.current');
  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Query failed: ${await res.text()}`);
  const data = await res.json();
  return new Set(data.result ?? []);
}

async function main() {
  const env = loadEnvLocal();
  const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "16jtlwpq";
  const dataset = env.NEXT_PUBLIC_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const token = env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN;

  if (!token) {
    console.error("Missing SANITY_API_TOKEN in .env.local");
    process.exit(1);
  }

  const existingSlugs = await fetchExistingSlugs(projectId, dataset, token);
  console.log(`Existing articles (${existingSlugs.size}):`, [...existingSlugs].sort().join(", "));

  const results = { imported: [], skipped: [], failed: [] };
  const imageCache = new Map();
  const mutateUrl = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`;

  for (const { slug, file } of ARTICLES) {
    if (existingSlugs.has(slug)) {
      console.log(`[skip] ${slug} — already in Sanity`);
      results.skipped.push(slug);
      continue;
    }

    if (!existsSync(file)) {
      console.error(`[fail] ${slug} — file not found: ${file}`);
      results.failed.push({ slug, error: `File not found: ${file}` });
      continue;
    }

    try {
      const html = readFileSync(file, "utf8");
      const parsed = parseHookupListHtml(html);

      if (!parsed.subjectName || !parsed.subtitle || parsed.entries.length === 0) {
        throw new Error(
          `Parse incomplete: subject=${parsed.subjectName}, subtitle=${parsed.subtitle}, entries=${parsed.entries.length}`
        );
      }

      console.log(
        `[parse] ${slug}: ${parsed.subjectName} — ${parsed.entries.length} entries, hero=${parsed.mainImageUrl ? "yes" : "no"}`
      );

      if (DRY_RUN) {
        parsed.entries.forEach((e, i) => console.log(`  ${i + 1}. ${e.age} — ${e.title}`));
        results.imported.push(slug);
        continue;
      }

      let mainImage = null;
      if (parsed.mainImageUrl) {
        if (!imageCache.has(parsed.mainImageUrl)) {
          imageCache.set(
            parsed.mainImageUrl,
            await uploadImageFromUrl({
              projectId,
              dataset,
              token,
              imageUrl: parsed.mainImageUrl,
              filenameBase: `${slug}-hero`,
            })
          );
        }
        mainImage = imageCache.get(parsed.mainImageUrl);
      }

      const doc = {
        _type: "article",
        slug: { _type: "slug", current: slug },
        title: parsed.subjectName,
        kicker: "Hookup Lists",
        subtitle: parsed.subtitle,
        summary: parsed.summary,
        brandExplainer,
        photoCredit: parsed.photoCredit,
        publishedDate: new Date().toISOString(),
        entries: parsed.entries,
        disclaimer,
        ...(mainImage ? { mainImage } : {}),
      };

      const res = await fetch(mutateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mutations: [{ create: doc }] }),
      });

      if (!res.ok) {
        throw new Error(`Sanity create failed (${res.status}): ${await res.text()}`);
      }

      const data = await res.json();
      const id = data.results?.[0]?.id ?? "?";
      console.log(`[ok] ${slug} created (${id})`);
      results.imported.push(slug);
      existingSlugs.add(slug);
    } catch (err) {
      console.error(`[fail] ${slug}:`, err.message);
      results.failed.push({ slug, error: err.message });
    }
  }

  const finalSlugs = [...existingSlugs].sort();
  console.log("\n=== Summary ===");
  console.log("Imported:", results.imported.join(", ") || "(none)");
  console.log("Skipped:", results.skipped.join(", ") || "(none)");
  console.log("Failed:", results.failed.length ? JSON.stringify(results.failed, null, 2) : "(none)");
  console.log(`Final count: ${finalSlugs.length} articles`);
  console.log("Slugs:", finalSlugs.join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
