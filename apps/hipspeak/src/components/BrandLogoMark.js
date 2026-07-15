/** Hipspeak logo mark via CSS mask (public/hip-logo-black.png); colored with currentColor. */
export default function BrandLogoMark({ className }) {
  return (
    <span
      className={`brand-mask brand-mask-logo ${className ?? ""}`.trim()}
      aria-hidden
    />
  );
}
