import { getReaderToken } from "@publication-websites/magic-client";
import { siteConfig } from "@/config/site";

/**
 * POST vote to magic /api/vote-response (Bearer required when token present).
 * @param {{ issueSlug: string, blockKey: string, selectedCode: string, correctOptionCode?: string | null }}
 */
export async function submitVoteToMagic({ issueSlug, blockKey, selectedCode, correctOptionCode }) {
  const origin = siteConfig.magicReaderApiOrigin?.replace(/\/$/, "");
  if (!origin) return null;

  const token = getReaderToken();
  if (!token) return null;

  const url = `${origin}/api/vote-response`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        brand: siteConfig.brandId,
        issueSlug,
        blockKey,
        selectedCode,
        ...(correctOptionCode ? { correctOptionCode } : {}),
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
