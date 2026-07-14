/** Brand logomark (public/tec-logo-black.png via CSS mask; colored with currentColor). */
export default function BrandLogoMark({ className }) {
  return (
    <span
      className={`brand-mask brand-mask-logo ${className ?? ""}`.trim()}
      aria-hidden
    />
  );
}
