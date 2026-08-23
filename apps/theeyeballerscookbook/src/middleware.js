/**
 * Edge redirects: email links hit "/" with query params; we send readers to the right page.
 * Recipe routes: pass slug to the root layout for SSR nav logo fill.
 * Legacy /article/ links (older emails/ads/profile cross-links) permanently redirect to /recipe/.
 * @see @publication-websites/platform-redirects
 */

import { NextResponse } from "next/server";
import { createHomeQueryMiddleware } from "@publication-websites/platform-redirects";

const homeQueryMiddleware = createHomeQueryMiddleware();

export default function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return homeQueryMiddleware(request);
  }

  if (pathname.startsWith("/article/")) {
    const slug = pathname.split("/").filter(Boolean)[1];
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/recipe/${slug}`;
      return NextResponse.redirect(url, 308);
    }
  }

  if (pathname.startsWith("/recipe/")) {
    const slug = pathname.split("/").filter(Boolean)[1];
    if (slug) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-recipe-slug", slug);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/article/:path*", "/recipe/:path*"],
};
