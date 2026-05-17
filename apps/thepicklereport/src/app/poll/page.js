import { Suspense } from "react";
import PollResult from "@/components/PollResult";
import { getArticleBySlug, getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import { findVoteBlock, normalizeChoiceCode } from "@/lib/vote-block";
import styles from "./page.module.css";

export default async function PollPage({ searchParams: searchParamsProp }) {
  const searchParams =
    typeof searchParamsProp?.then === "function"
      ? await searchParamsProp
      : searchParamsProp ?? {};

  const choice = normalizeChoiceCode(searchParams.choice ?? searchParams.poll);
  const issueSlug =
    typeof searchParams.issue === "string" ? searchParams.issue.trim() : "";

  let voteBlock = null;
  let articleTitle = null;
  let recommendations = [];

  if (issueSlug) {
    const article = await getArticleBySlug(issueSlug);
    if (article) {
      articleTitle = article.title;
      voteBlock = findVoteBlock(article.contentBlocks);
    }
    const articles = await getArticles();
    recommendations = pickRandomArticles(articles, {
      excludeSlug: issueSlug,
      count: 6,
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
        issueSlug={issueSlug}
        choice={choice}
        voteBlock={voteBlock}
        articleTitle={articleTitle}
        recommendations={recommendations}
      />
    </Suspense>
  );
}
