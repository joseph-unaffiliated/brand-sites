import Image from "next/image";

/** Hard Resets wordmark (`public/hr-wordmark-*.png`). */
export default function BrandWordmark({ className, variant = "black" }) {
  const src =
    variant === "white" ? "/hr-wordmark-white.png" : "/hr-wordmark-black.png";

  return (
    <Image
      src={src}
      alt="Hard Resets"
      width={180}
      height={23}
      className={className}
      priority
    />
  );
}
