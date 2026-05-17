import { siteConfig } from "@/config/site";

/**
 * POST vote to magic (when /api/vote-response exists). Returns distribution + scoring fields.
 * @param {{ issueSlug: string, blockKey: string, selectedCode: string, email?: string | null }}
 */
export async function submitVoteToMagic({ issueSlug, blockKey, selectedCode, email }) {
  const origin = siteConfig.magicReaderApiOrigin?.replace(/\/$/, "");
  if (!origin) return null;

  const url = `${origin}/api/vote-response`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: siteConfig.brandId,
        issueSlug,
        blockKey,
        selectedCode,
        ...(email ? { email } : {}),
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
