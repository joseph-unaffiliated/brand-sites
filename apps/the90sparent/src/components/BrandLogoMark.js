import { siteMonogram } from "@/config/site";

/** Circular monogram placeholder until a custom mark ships. */
export default function BrandLogoMark({ className }) {
  return (
    <span className={`brand-monogram ${className ?? ""}`} aria-hidden>
      {siteMonogram}
    </span>
  );
}
