import { redirect } from "next/navigation";

/**
 * Legacy redirect shim: old links use /poll?issue=<slug>&choice=<code>.
 * Canonical results now live at /pollresults/[slug]; forward query-based
 * visitors there (see @/lib/vote-block for new link generation).
 */
export default async function LegacyPollRedirectPage({
  searchParams: searchParamsProp,
}) {
  const searchParams =
    typeof searchParamsProp?.then === "function"
      ? await searchParamsProp
      : searchParamsProp ?? {};

  const issueSlug =
    typeof searchParams.issue === "string" ? searchParams.issue.trim() : "";

  if (!issueSlug) {
    redirect("/");
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "issue") continue;
    if (typeof value === "string") params.set(key, value);
  }
  const qs = params.toString();

  redirect(`/pollresults/${encodeURIComponent(issueSlug)}${qs ? `?${qs}` : ""}`);
}
