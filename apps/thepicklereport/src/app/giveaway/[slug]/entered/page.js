import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getGiveaway, GIVEAWAYS } from "@/config/giveaways";
import GiveawayEntered from "./GiveawayEntered";

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

  return (
    <Suspense>
      <GiveawayEntered giveaway={giveaway} />
    </Suspense>
  );
}
