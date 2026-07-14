"use client";

import { useLayoutEffect } from "react";
import { useSetNavLogoFillImage } from "@/context/NavLogoImageContext";

/** Sets the nav logomark fill image while an article (or other page) is mounted. */
export default function NavLogoImageSync({ image }) {
  const setFillImage = useSetNavLogoFillImage();

  useLayoutEffect(() => {
    setFillImage(image ?? null);
    return () => setFillImage(null);
  }, [image, setFillImage]);

  return null;
}
