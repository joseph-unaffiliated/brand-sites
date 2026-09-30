"use client";

import { getReaderToken } from "@publication-websites/magic-client";
import { siteConfig } from "@/config/site";
import { fetchVerifiedSubscriptionsForSite } from "@/lib/reader-profile";

/**
 * Data every house-ad slot needs, loaded once and kept between pages so ads never wait on
 * the network for it: the creative pool (session cache) and what we know about the reader
 * (last verified profile, refreshed in the background for the next page).
 */

const POOL_KEY = `house_ads_pool_${siteConfig.brandId}`;
const POOL_TTL_MS = 5 * 60_000;
const PROFILE_KEY = `reader_ad_profile_${siteConfig.brandId}`;
const PROFILE_MAX_AGE_MS = 30 * 24 * 60 * 60_000;
const PROFILE_REFRESH_MS = 10 * 60_000;

let poolPromise = null;
let poolAt = 0;
let profileRefresh = null;

/** @param {"localStorage" | "sessionStorage"} storage */
function readJson(storage, key) {
  try {
    return JSON.parse(window[storage].getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeJson(storage, key, value) {
  try {
    window[storage].setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the next page just fetches again */
  }
}

/** @returns {Promise<object[]>} */
export function loadHouseCreatives() {
  if (poolPromise && Date.now() - poolAt < POOL_TTL_MS) return poolPromise;
  const cached = readJson("sessionStorage", POOL_KEY);
  if (cached && Date.now() - cached.at < POOL_TTL_MS && Array.isArray(cached.creatives)) {
    poolAt = cached.at;
    poolPromise = Promise.resolve(cached.creatives);
    return poolPromise;
  }
  poolAt = Date.now();
  poolPromise = fetch("/api/house-ads/pool")
    .then((res) => res.json())
    .then((data) => {
      const creatives = Array.isArray(data?.creatives) ? data.creatives : [];
      if (creatives.length) writeJson("sessionStorage", POOL_KEY, { at: Date.now(), creatives });
      return creatives;
    })
    .catch(() => {
      poolPromise = null;
      return [];
    });
  return poolPromise;
}

/** Tokens are stored per browser already; the tail is enough to notice a different reader. */
function tokenTag(token) {
  return String(token).slice(-24);
}

/**
 * Last verified profile for the current reader token, or null (anonymous, new reader, or stale).
 * @returns {{ subscribedBrands: string[], jewishInterested: boolean } | null}
 */
export function readReaderAdProfile() {
  const token = getReaderToken();
  if (!token) return null;
  const cached = readJson("localStorage", PROFILE_KEY);
  if (!cached || cached.tag !== tokenTag(token)) return null;
  if (Date.now() - cached.at > PROFILE_MAX_AGE_MS) return null;
  return {
    subscribedBrands: Array.isArray(cached.subscribedBrands) ? cached.subscribedBrands : [],
    jewishInterested: !!cached.jewishInterested,
  };
}

/** Background refresh of the reader profile; one request at a time, at most every ten minutes. */
export function refreshReaderAdProfile() {
  if (profileRefresh) return profileRefresh;
  const token = getReaderToken();
  if (!token) return Promise.resolve();
  const cached = readJson("localStorage", PROFILE_KEY);
  if (cached?.tag === tokenTag(token) && Date.now() - cached.at < PROFILE_REFRESH_MS) {
    return Promise.resolve();
  }
  profileRefresh = fetchVerifiedSubscriptionsForSite(token)
    .then((profile) => {
      writeJson("localStorage", PROFILE_KEY, {
        tag: tokenTag(token),
        at: Date.now(),
        subscribedBrands: profile?.subscribedBrands || [],
        jewishInterested: !!profile?.jewishInterested,
      });
    })
    .catch(() => {
      /* best-effort — ads keep using the last known profile */
    })
    .finally(() => {
      profileRefresh = null;
    });
  return profileRefresh;
}

/** Start both loads early; called on every route, including pages without ad slots. */
export function warmHouseAdData() {
  if (typeof window === "undefined") return;
  loadHouseCreatives();
  refreshReaderAdProfile();
}

warmHouseAdData();
