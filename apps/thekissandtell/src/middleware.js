/**
 * Edge redirects: email links hit "/" with query params; we send readers to the right page.
 * @see @publication-websites/platform-redirects
 */

import { createHomeQueryMiddleware } from "@publication-websites/platform-redirects";

export default createHomeQueryMiddleware();

export const config = {
  matcher: "/",
};
