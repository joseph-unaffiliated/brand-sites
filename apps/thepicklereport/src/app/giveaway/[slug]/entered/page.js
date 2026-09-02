import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGiveaway, GIVEAWAYS } from "@/config/giveaways";
import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";
import RecommendedArticleCards from "@/components/RecommendedArticleCards";
import GiveawayEntered from "./GiveawayEntered";

const READ_MORE_COUNT = 3;

export function generateStaticParams() {
  return GIVEAWAYS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const giveaway = getGiveaway(slug);
  if (!giveaway) return { title: "Giveaway entry" };
  return {
    title: `Entered | ${giveaway.title}`,
    robots: { index: false, follow: false },
  };
}

export default async function GiveawayEnteredPage({ params }) {
  const { slug } = await params;
  const giveaway = getGiveaway(slug);
  if (!giveaway) notFound();

  const allArticles = await getArticles();
  const readMore = pickRandomArticles(allArticles, { count: READ_MORE_COUNT });

  return (
    <>
      <Suspense>
        <GiveawayEntered giveaway={giveaway} />
      </Suspense>
      <RecommendedArticleCards articles={readMore} />
    </>
  );
}
