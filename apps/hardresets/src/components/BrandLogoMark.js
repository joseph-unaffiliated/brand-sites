import Image from "next/image";

/** Compact mark for footer / small placements. */
export default function BrandLogoMark({ className }) {
  return (
    <Image
      src="/hr-wordmark-black.png"
      alt=""
      width={120}
      height={15}
      className={className}
      aria-hidden
    />
  );
}
