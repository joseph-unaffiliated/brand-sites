import Image from "next/image";
import { siteDisplayName } from "@/config/site";

/** Wordmark image; use variant="light" on dark backgrounds (footer). */
export default function BrandWordmark({ className, variant = "dark" }) {
  const src =
    variant === "light" ? "/tkat-wordmark-white.png" : "/tkat-wordmark-black.png";

  return (
    <Image
      src={src}
      alt={siteDisplayName}
      width={220}
      height={36}
      priority
      className={className}
    />
  );
}
