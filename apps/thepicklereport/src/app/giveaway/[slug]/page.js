import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGiveaway, GIVEAWAYS, giveawayStatus } from "@/config/giveaways";
import GiveawayLanding from "./GiveawayLanding";

export function generateStaticParams() {
  return GIVEAWAYS.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const giveaway = getGiveaway(slug);
  if (!giveaway) return { title: "Giveaway" };
  const ended = giveawayStatus(giveaway) === "ended";
  return {
    title: giveaway.seoTitle || `${giveaway.title} | The Pickle Report`,
    description: giveaway.seoDescription || giveaway.prizeBody,
    robots: ended ? { index: true, follow: true } : undefined,
  };
}

export default async function GiveawayPage({ params }) {
  const { slug } = await params;
  const giveaway = getGiveaway(slug);
  if (!giveaway) notFound();

  return (
    <Suspense>
      <GiveawayLanding giveaway={giveaway} />
    </Suspense>
  );
}
