"use client";

import Image from "next/image";

function isGifUrl(url) {
  if (!url || typeof url !== "string") return false;
  try {
    const pathname = url.startsWith("http")
      ? new URL(url).pathname
      : url.split("?")[0];
    return pathname.toLowerCase().endsWith(".gif");
  } catch {
    return url.split("?")[0].toLowerCase().endsWith(".gif");
  }
}

/** Sanity CDN image: native img for GIFs, Next Image otherwise. */
export default function SanityMedia({
  src,
  alt,
  width,
  height,
  className,
  priority,
  sizes,
  style,
}) {
  if (!src) return null;

  if (isGifUrl(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt ?? ""}
        width={width}
        height={height}
        className={className}
        style={style}
        decoding="async"
        {...(priority ? { fetchPriority: "high" } : {})}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
      style={style}
    />
  );
}
