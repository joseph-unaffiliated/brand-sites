import Image from "next/image";

/** Hard Resets wordmark (`public/hr-wordmark-black.png`). */
export default function BrandWordmark({ className }) {
  return (
    <Image
      src="/hr-wordmark-black.png"
      alt="Hard Resets"
      width={180}
      height={22}
      className={className}
      priority
    />
  );
}
