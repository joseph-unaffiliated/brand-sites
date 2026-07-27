import { Suspense } from 'react';
import { getArticles } from '@/lib/articles';
import { pickRandomArticles } from '@/lib/pickRandomArticles';
import SubscribedContent from './SubscribedContent';

const ARTICLE_REC_COUNT = 3;

export default async function SubscribedPage() {
  const allArticles = await getArticles();
  const recommendedArticles = pickRandomArticles(allArticles, { count: ARTICLE_REC_COUNT });

  return (
    <Suspense>
      <SubscribedContent recommendedArticles={recommendedArticles} />
    </Suspense>
  );
}
