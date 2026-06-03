import Image from "next/image";

/** Large marketing-header logomark (`public/hr-logo-black.png`). */
export default function BrandLogoMarkLarge({ className }) {
  return (
    <Image
      src="/hr-logo-black.png"
      alt=""
      width={136}
      height={96}
      className={className}
      aria-hidden
      priority
    />
  );
}
