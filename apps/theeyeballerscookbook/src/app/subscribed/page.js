import { Suspense } from 'react';
import { getRecipes } from '@/lib/recipes';
import { pickRandomArticles } from '@/lib/pickRandomArticles';
import SubscribedContent from './SubscribedContent';

const RECIPE_REC_COUNT = 3;

export default async function SubscribedPage() {
  const allRecipes = await getRecipes();
  const recommendedArticles = pickRandomArticles(allRecipes, { count: RECIPE_REC_COUNT });

  return (
    <Suspense>
      <SubscribedContent recommendedArticles={recommendedArticles} />
    </Suspense>
  );
}
