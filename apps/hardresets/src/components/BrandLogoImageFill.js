/**
 * Viewport-sized hero photo visible through a CSS mask (H|R mark or wordmark).
 */
export default function BrandLogoImageFill({ className, fillClassName, fillImageUrl }) {
  if (!fillImageUrl) return null;

  return (
    <span
      className={`${fillClassName} ${className ?? ""}`.trim()}
      style={{ "--header-mark-bg-image": `url("${fillImageUrl}")` }}
      aria-hidden
    />
  );
}
