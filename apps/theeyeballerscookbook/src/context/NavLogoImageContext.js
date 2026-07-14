"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const NavLogoImageContext = createContext(null);

/** Default fill image (latest issue) from the root layout; article pages override via sync. */
export function NavLogoImageProvider({ defaultFillImage, initialPageFillImage = null, children }) {
  const [pageFillImage, setPageFillImage] = useState(initialPageFillImage);

  const setFillImage = useCallback((image) => {
    setPageFillImage(image || null);
  }, []);

  const value = useMemo(
    () => ({ defaultFillImage, pageFillImage, setFillImage }),
    [defaultFillImage, pageFillImage, setFillImage],
  );

  return (
    <NavLogoImageContext.Provider value={value}>{children}</NavLogoImageContext.Provider>
  );
}

export function useNavLogoFillImage(pathname) {
  const ctx = useContext(NavLogoImageContext);
  if (!ctx) return null;

  const isArticle = (pathname || "").startsWith("/recipe/");
  if (isArticle) return ctx.pageFillImage ?? null;
  return ctx.defaultFillImage ?? null;
}

export function useSetNavLogoFillImage() {
  return useContext(NavLogoImageContext)?.setFillImage ?? (() => {});
}
