#!/usr/bin/env node
/**
 * Import email-issue articles (Liam, Beth, Annie, Grant, Jenni, Talia, Sarah, Ari) into Sanity.
 * For David's List use: node scripts/import-david-article.mjs
 *
 * 1. Create an API token at https://sanity.io/manage → Project (16jtlwpq) → API → Tokens (Editor or Admin).
 * 2. Add to .env.local: SANITY_API_TOKEN=your-token
 * 3. From project root: node scripts/import-all-email-articles.mjs
 *
 * Main images are not imported; add them in Studio. If you already have an article with slug "sarah", either
 * delete it first or change the slug in email-articles-content.mjs (e.g. sarah-issue9).
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { allEmailArticles } from "./email-articles-content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnvLocal();
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN;

if (!projectId) {
  console.error("Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local");
  process.exit(1);
}
if (!token) {
  console.error(
    "Missing SANITY_API_TOKEN. Create a token at https://sanity.io/manage → your project → API → Tokens, then add SANITY_API_TOKEN=... to .env.local"
  );
  process.exit(1);
}

const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/mutate/${dataset}`;

const mutations = allEmailArticles.map((doc) => ({ create: doc }));

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mutations }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Sanity API error:", res.status, text);
    process.exit(1);
  }

  const data = await res.json();
  const ids = data.results ?? [];
  const slugs = allEmailArticles.map((a) => a.slug?.current ?? "?");
  console.log("Created", ids.length, "articles:");
  slugs.forEach((slug, i) => console.log("  -", slug, ids[i]?.id ?? "(no id)"));
  console.log("\nAdd main images in Studio if needed. Article URLs: http://localhost:3000/article/<slug>");
}

main();
