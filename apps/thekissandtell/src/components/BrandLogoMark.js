import Image from "next/image";

/** Gradient K mark (mobile header / footer fallback). */
export default function BrandLogoMark({ className }) {
  return (
    <Image
      src="/tkat-logo.png"
      alt=""
      width={48}
      height={48}
      className={className}
      aria-hidden
    />
  );
}
