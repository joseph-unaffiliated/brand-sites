import BrandLogoImageFill from "@/components/BrandLogoImageFill";

/**
 * Large marketing-header logomark.
 * Default: SVG paths in `currentColor`. With `fillImageUrl`, a full-viewport photo shows through the H|R mask.
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

  return (
    <svg
      className={className}
      viewBox="0 0 34 24"
      width="34"
      height="24"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <path
        d="M0 24V0H5.33333V8H10.6667V0H16V24H10.6667V13.3333H5.33333V24H0Z"
        fill="currentColor"
      />
      <path
        d="M28.6237 8V5.33333H23.2904V8H28.6237ZM17.957 24V0H31.2904C32.0126 0 32.6376 0.263889 33.1654 0.791667C33.6932 1.31944 33.957 1.94444 33.957 2.66667V9.33333C33.957 9.72222 33.6932 10.0417 33.1654 10.2917C32.6376 10.5417 32.0126 10.6667 31.2904 10.6667C32.0126 10.6667 32.6376 10.8056 33.1654 11.0833C33.6932 11.3333 33.957 11.6389 33.957 12V24H28.6237V13.3333H23.2904V24H17.957Z"
        fill="currentColor"
      />
    </svg>
  );
}
