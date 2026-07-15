import BrandLogoImageFill from "@/components/BrandLogoImageFill";

/** Hipspeak wordmark via CSS mask (public/hip-wordmark-black.png); colored with currentColor. */
export default function BrandWordmark({ className, fillImageUrl }) {
  if (fillImageUrl) {
    return (
      <BrandLogoImageFill
        className={className}
        fillClassName="brand-logo-wordmark-fill"
        fillImageUrl={fillImageUrl}
      />
    );
  }

  return (
    <span
      className={`brand-mask brand-mask-wordmark ${className ?? ""}`.trim()}
      aria-hidden
    />
  );
}
