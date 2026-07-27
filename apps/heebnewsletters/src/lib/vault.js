/**
 * Vault issue data layer: wires the shared Sanity queries to this site's project.
 * One vault issue = one "From the Vault, by Heeb" email — an editor's intro
 * framing a piece of 2000s Jewish counter-culture media, plus a Rabbit Hole
 * of curated further-reading links.
 */

import {
  createSanityLayer,
  createVaultIssueQueries,
} from "@publication-websites/sanity-content";

const layer = createSanityLayer({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production",
});

const queries = createVaultIssueQueries({
  ...layer,
  fallbackImage: process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/ftv-logo-black.png",
});

export async function getVaultIssues() {
  return queries.getVaultIssues();
}

export async function getVaultIssueBySlug(slug) {
  return queries.getVaultIssueBySlug(slug);
}

export async function getVaultIssueSlugs() {
  return queries.getVaultIssueSlugs();
}

/** The featured issue is simply the newest published vault issue. */
export async function getLatestVaultIssue() {
  const issues = await getVaultIssues();
  return issues[0] ?? null;
}
