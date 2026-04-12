import { siteDisplayName } from "@/config/site";

/** Text wordmark; replace with custom SVG in public/ when brand assets are ready. */
export default function BrandWordmark({ className }) {
  return <span className={`brand-text-wordmark ${className ?? ""}`}>{siteDisplayName}</span>;
}
