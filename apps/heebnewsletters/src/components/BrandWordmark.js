/** Heeb Magazine color wordmark (public/heeb-wordmark.svg, 328×98). */
export default function BrandWordmark({ className }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/heeb-wordmark.svg"
      alt=""
      width={328}
      height={98}
      className={`brand-wordmark-img ${className ?? ""}`.trim()}
      aria-hidden
    />
  );
}
