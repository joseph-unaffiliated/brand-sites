import BrandLogoMark from "@/components/BrandLogoMark";

/**
 * Large marketing-header logomark.
 * Always the crisp inline SVG (no photo-through-mask) — the CSS mask path
 * looked soft when scaled up in the marketing header.
 */
export default function BrandLogoMarkLarge({ className }) {
  return <BrandLogoMark className={className} />;
}
