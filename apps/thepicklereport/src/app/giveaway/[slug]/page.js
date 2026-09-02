import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGiveaway, GIVEAWAYS, giveawayIndexRobots } from "@/config/giveaways";
import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import RecommendedArticleCards from "@/components/RecommendedArticleCards";
import GiveawayLanding from "./GiveawayLanding";

const READ_MORE_COUNT = 3;

export function generateStaticParams() {
  return GIVEAWAYS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const giveaway = getGiveaway(slug);
  if (!giveaway) return { title: "Giveaway", robots: { index: false, follow: false } };
  return {
    title: giveaway.seoTitle || `${giveaway.title} | The Pickle Report`,
    description: giveaway.seoDescription || giveaway.prizeBody,
    robots: giveawayIndexRobots(giveaway),
  };
}

export default async function GiveawayPage({ params }) {
  const { slug } = await params;
  const giveaway = getGiveaway(slug);
  if (!giveaway) notFound();

  const allArticles = await getArticles();
  const readMore = pickRandomArticles(allArticles, { count: READ_MORE_COUNT });

  return (
    <>
      <Suspense>
        <GiveawayLanding giveaway={giveaway} />
      </Suspense>
      <RecommendedArticleCards articles={readMore} />
    </>
  );
}
