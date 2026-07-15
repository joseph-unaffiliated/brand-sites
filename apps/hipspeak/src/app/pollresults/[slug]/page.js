import { Suspense } from "react";
import PollResult from "@/components/PollResult";
import { getSlangEntryBySlug, getSlangEntries } from "@/lib/slang";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import { normalizeChoiceCode, voteBlockFromSlangEntry } from "@/lib/vote-block";
import styles from "./page.module.css";

export default async function PollResultsPage({
  params: paramsProp,
  searchParams: searchParamsProp,
}) {
  const params =
    typeof paramsProp?.then === "function" ? await paramsProp : paramsProp ?? {};
  const searchParams =
    typeof searchParamsProp?.then === "function"
      ? await searchParamsProp
      : searchParamsProp ?? {};

  const wordSlug = typeof params.slug === "string" ? params.slug.trim() : "";
  const choice = normalizeChoiceCode(searchParams.choice ?? searchParams.poll);

  let voteBlock = null;
  let recommendations = [];

  if (wordSlug) {
    const entry = await getSlangEntryBySlug(wordSlug);
    if (entry) {
      voteBlock = voteBlockFromSlangEntry(entry);
    }
    const entries = await getSlangEntries();
    recommendations = pickRandomArticles(entries, {
      excludeSlug: wordSlug,
      count: 3,
    });
  }

  return (
    <Suspense
      fallback={
        <div className={styles.wrap}>
          <p className={styles.body}>Loading…</p>
        </div>
      }
    >
      <PollResult
        issueSlug={wordSlug}
        choice={choice}
        voteBlock={voteBlock}
        recommendations={recommendations}
      />
    </Suspense>
  );
}
