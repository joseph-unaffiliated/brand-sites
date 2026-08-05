"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";

const HouseAdClaimContext = createContext(null);

/**
 * Page-scoped claims so mid / rail / bottom / sticky don't drive to the same URL.
 * Fetches run through a serial queue so parallel mounts see prior claims.
 */
export function HouseAdClaimProvider({ children }) {
  /** @type {React.MutableRefObject<Map<string, string>>} ownerId → normalized click URL */
  const claimsRef = useRef(new Map());
  const queueRef = useRef(Promise.resolve());

  const getPageExcluded = useCallback((ownerId) => {
    const out = [];
    for (const [id, clickUrl] of claimsRef.current) {
      if (id !== ownerId && clickUrl) out.push(clickUrl);
    }
    return out;
  }, []);

  const claim = useCallback((ownerId, clickUrl) => {
    const key = clickUrl ? String(clickUrl) : "";
    if (!key) claimsRef.current.delete(ownerId);
    else claimsRef.current.set(ownerId, key);
  }, []);

  const release = useCallback((ownerId) => {
    claimsRef.current.delete(ownerId);
  }, []);

  const runExclusive = useCallback((fn) => {
    const run = queueRef.current.then(fn, fn);
    queueRef.current = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }, []);

  const value = useMemo(
    () => ({ getPageExcluded, claim, release, runExclusive }),
    [getPageExcluded, claim, release, runExclusive]
  );

  return (
    <HouseAdClaimContext.Provider value={value}>{children}</HouseAdClaimContext.Provider>
  );
}

export function useHouseAdClaims() {
  return useContext(HouseAdClaimContext);
}
