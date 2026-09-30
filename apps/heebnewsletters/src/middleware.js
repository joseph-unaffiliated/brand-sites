/**
 * Edge redirects: email links hit "/" with query params; we send readers to the right page.
 * @see @publication-websites/platform-redirects
 */

import { createHomeQueryMiddleware } from "@publication-websites/platform-redirects";

/** Heeb Magazine has no polls: a null route leaves `/?poll=` on the homepage instead of 404ing. */
const homeQueryMiddleware = createHomeQueryMiddleware({ poll: null });

export default function middleware(request) {
  return homeQueryMiddleware(request);
}

export const config = {
  matcher: ["/"],
};
