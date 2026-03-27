/**
 * Home-page query redirects (e.g. email links land on /?subscribed=true).
 *
 * Non-technical readers: email and ad links often send people to the *homepage*
 * with special ?parameters. This module decides “they meant the poll page” or
 * “they just subscribed” and quietly sends them to the right page, once.
 *
 * Engineers: each Next app wraps this in middleware.js with an optional route map
 * when a publication needs different paths (e.g. /poll → /p).
 */

import { NextResponse } from "next/server";

/** @typedef {{ poll?: string; subscribed?: string; unsubscribed?: string; snoozed?: string; request?: string }} SiteRouteMap */

const DEFAULT_ROUTES = /** @type {Required<SiteRouteMap>} */ ({
  poll: "/poll",
  subscribed: "/subscribed",
  unsubscribed: "/unsubscribed",
  snoozed: "/snoozed",
  request: "/request",
});

/**
 * Reads homepage search params and returns which “intent” we should route to, if any.
 * @param {URLSearchParams} searchParams
 * @returns {{ kind: keyof typeof DEFAULT_ROUTES } | null}
 */
export function normalizeHomeIntent(searchParams) {
  if (searchParams.has("poll")) return { kind: "poll" };
  if (searchParams.get("subscribed") === "true") return { kind: "subscribed" };
  if (searchParams.get("unsubscribed") === "true") return { kind: "unsubscribed" };
  if (searchParams.get("snoozed") === "true") return { kind: "snoozed" };
  if (searchParams.get("request") === "true") return { kind: "request" };
  return null;
}

/**
 * @param {{ kind: keyof typeof DEFAULT_ROUTES }} intent
 * @param {SiteRouteMap} routeMap
 * @returns {string | null} Relative path or null if unsafe / unknown.
 */
export function pathForIntent(intent, routeMap = {}) {
  const map = { ...DEFAULT_ROUTES, ...routeMap };
  const path = map[intent.kind];
  if (typeof path !== "string" || !path.startsWith("/") || path.includes("//")) {
    return null;
  }
  return path;
}

/**
 * Strip query keys we consumed so the destination page gets a cleaner URL.
 * @param {URL} url
 * @param {{ kind: keyof typeof DEFAULT_ROUTES }} intent
 */
export function stripConsumedSearchParams(url, intent) {
  switch (intent.kind) {
    case "poll":
      url.searchParams.delete("poll");
      break;
    case "subscribed":
      url.searchParams.delete("subscribed");
      break;
    case "unsubscribed":
      url.searchParams.delete("unsubscribed");
      break;
    case "snoozed":
      url.searchParams.delete("snoozed");
      break;
    case "request":
      url.searchParams.delete("request");
      break;
    default:
      break;
  }
}

/**
 * Factory for Next.js middleware: only runs the homepage matcher by default.
 * @param {SiteRouteMap} [routeMap]
 */
export function createHomeQueryMiddleware(routeMap = {}) {
  return function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;
    if (pathname !== "/") {
      return NextResponse.next();
    }
    const intent = normalizeHomeIntent(searchParams);
    if (!intent) {
      return NextResponse.next();
    }
    const targetPath = pathForIntent(intent, routeMap);
    if (!targetPath) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    stripConsumedSearchParams(url, intent);
    return NextResponse.redirect(url);
  };
}
