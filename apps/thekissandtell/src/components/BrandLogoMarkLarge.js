import BrandLogoImageFill from "@/components/BrandLogoImageFill";
import BrandLogoMark from "@/components/BrandLogoMark";

/**
 * Large marketing-header logomark.
 * Default: PNG circle-K mark. With `fillImageUrl`, a full-viewport photo shows through the mask.
 */
export default function BrandLogoMarkLarge({ className, fillImageUrl }) {
  if (fillImageUrl) {
    return (
      <BrandLogoImageFill
        className={className}
        fillClassName="brand-logo-mark-fill"
        fillImageUrl={fillImageUrl}
      />
    );
  }

  return <BrandLogoMark className={className} />;
}
