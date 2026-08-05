"use client";

import { useEffect, useState } from "react";

/** Start easing in a dark wash once average luma crosses this. */
const LUMA_DIM_START = 0.68;
/** Full minor overlay by this luma (near-white heroes). */
const LUMA_DIM_FULL = 0.88;
/** Max black overlay alpha — enough for legibility, still “minor”. */
const OVERLAY_MAX = 0.34;

/**
 * Tiny proxy URL for fast luminance sampling (Sanity CDN honors `w`).
 * @param {string} url
 */
function samplingUrl(url) {
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://cdn.sanity.io";
    const u = new URL(url, base);
    // Only shrink Sanity (or already-parametrized CDN) URLs for a cheap sample.
    if (u.hostname.includes("cdn.sanity.io") || u.searchParams.has("w") || u.searchParams.has("auto")) {
      u.searchParams.set("w", "64");
      u.searchParams.set("q", "40");
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * @param {string} imageUrl
 * @returns {Promise<number | null>} 0–1 relative luminance, or null if unreadable
 */
function averageLuminance(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let sum = 0;
        const pixels = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          sum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
        resolve(sum / pixels);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

/** @param {number} luma */
function overlayForLuma(luma) {
  const t = Math.min(1, Math.max(0, (luma - LUMA_DIM_START) / (LUMA_DIM_FULL - LUMA_DIM_START)));
  return Number((t * OVERLAY_MAX).toFixed(3));
}

/**
 * Viewport-sized hero photo visible through a CSS mask (TNP mark or wordmark).
 * When the photo is very bright/white, applies a minor dark overlay so the
 * logotype stays legible against the page background.
 */
export default function BrandLogoImageFill({ className, fillClassName, fillImageUrl }) {
  const [overlay, setOverlay] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setOverlay(0);
    if (!fillImageUrl) return undefined;

    averageLuminance(samplingUrl(fillImageUrl)).then((luma) => {
      if (cancelled || luma == null) return;
      setOverlay(overlayForLuma(luma));
    });

    return () => {
      cancelled = true;
    };
  }, [fillImageUrl]);

  if (!fillImageUrl) return null;

  return (
    <span
      className={`${fillClassName} ${className ?? ""}`.trim()}
      style={{
        "--header-mark-bg-image": `url("${fillImageUrl}")`,
        "--header-mark-overlay": String(overlay),
      }}
      aria-hidden
    />
  );
}
