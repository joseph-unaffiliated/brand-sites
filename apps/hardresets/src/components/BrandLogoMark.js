import Image from "next/image";

/** H|R mark for mobile header / footer (`public/hr-logo-*.png`). */
export default function BrandLogoMark({ className, variant = "black" }) {
  const src = variant === "white" ? "/hr-logo-white.png" : "/hr-logo-black.png";

  return (
    <Image
      src={src}
      alt=""
      width={48}
      height={34}
      className={className}
      aria-hidden
    />
  );
}
