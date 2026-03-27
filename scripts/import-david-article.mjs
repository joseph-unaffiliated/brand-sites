#!/usr/bin/env node
/**
 * Import "David's List" article into Sanity.
 *
 * 1. Create an API token at https://sanity.io/manage → Project (16jtlwpq) → API → Tokens.
 *    Grant "Editor" or "Admin".
 * 2. Add to apps/hookuplists/.env.local: SANITY_API_TOKEN=your-token
 * 3. From repo root: node scripts/import-david-article.mjs
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { davidArticle } from "./david-article-content.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

async function main() {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      mutations: [{ create: davidArticle }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Sanity API error:", res.status, text);
    process.exit(1);
  }

  const data = await res.json();
  console.log("Article created. Document ID:", data.results?.[0]?.id ?? data);
  console.log("View in Studio, then add the main image (David photo URL from email) if you want.");
  console.log("Site article URL: http://localhost:3000/article/david");
}

main();
