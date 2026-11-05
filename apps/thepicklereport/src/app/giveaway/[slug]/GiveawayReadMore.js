import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import RecommendedArticleCards from "@/components/RecommendedArticleCards";

const READ_MORE_COUNT = 3;
/** Don't let Sanity TLS blips hang the giveaway conversion path. */
const SANITY_BUDGET_MS = 2000;

async function getArticlesWithBudget() {
  try {
    return await Promise.race([
      getArticles(),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("sanity_timeout")), SANITY_BUDGET_MS);
      }),
    ]);
  } catch {
    return [];
  }
}

/**
 * Streamed below the giveaway shell. Failure/timeout → no cards (page still works).
 */
export default async function GiveawayReadMore() {
  const allArticles = await getArticlesWithBudget();
  const readMore = pickRandomArticles(allArticles, { count: READ_MORE_COUNT });
  return <RecommendedArticleCards articles={readMore} />;
}
