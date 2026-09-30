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
  /** At most one SparkLoop recommendation ad per page view. */
  const sparkloopOwnerRef = useRef(null);
  /** Pathname where SparkLoop had nothing to show; skip it for the rest of that page. */
  const sparkloopEmptyPathRef = useRef(null);

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
    if (sparkloopOwnerRef.current === ownerId) sparkloopOwnerRef.current = null;
  }, []);

  const canClaimSparkloop = useCallback((ownerId) => {
    const owner = sparkloopOwnerRef.current;
    if (owner && owner !== ownerId) return false;
    return sparkloopEmptyPathRef.current !== window.location.pathname;
  }, []);

  const claimSparkloop = useCallback((ownerId) => {
    sparkloopOwnerRef.current = ownerId;
  }, []);

  const markSparkloopEmpty = useCallback((ownerId) => {
    sparkloopEmptyPathRef.current = window.location.pathname;
    if (sparkloopOwnerRef.current === ownerId) sparkloopOwnerRef.current = null;
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
    () => ({
      getPageExcluded,
      claim,
      release,
      runExclusive,
      canClaimSparkloop,
      claimSparkloop,
      markSparkloopEmpty,
    }),
    [
      getPageExcluded,
      claim,
      release,
      runExclusive,
      canClaimSparkloop,
      claimSparkloop,
      markSparkloopEmpty,
    ]
  );

  return (
    <HouseAdClaimContext.Provider value={value}>{children}</HouseAdClaimContext.Provider>
  );
}

export function useHouseAdClaims() {
  return useContext(HouseAdClaimContext);
}
