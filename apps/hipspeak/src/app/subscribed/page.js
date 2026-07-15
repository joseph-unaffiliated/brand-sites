import { Suspense } from 'react';
import { getSlangEntries } from '@/lib/slang';
import { pickRandomArticles } from '@/lib/pickRandomArticles';
import SubscribedContent from './SubscribedContent';

const ARTICLE_REC_COUNT = 3;

export default async function SubscribedPage() {
  const allArticles = await getSlangEntries();
  const recommendedArticles = pickRandomArticles(allArticles, { count: ARTICLE_REC_COUNT });

  return (
    <Suspense>
      <SubscribedContent recommendedArticles={recommendedArticles} />
    </Suspense>
  );
}
