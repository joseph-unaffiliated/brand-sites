import { BRAND } from "@/lib/subscription";

/**
 * @param {URLSearchParams} searchParams
 * @param {string} [brand=BRAND]
 * @returns {string | null}
 */
export function resolveEmailFromUrlOrStorage(searchParams, brand = BRAND) {
  const fromUrl = searchParams.get("email");
  if (fromUrl) {
    try {
      return decodeURIComponent(fromUrl);
    } catch {
      return fromUrl;
    }
  }
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`email_${brand}`);
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
