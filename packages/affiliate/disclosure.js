/**
 * Shared affiliate disclosure copy for legal pages.
 * Plain helpers (no JSX) so apps can render with their own layout/CSS.
 */

/**
 * @param {{ siteDisplayName: string, publisherName?: string }} opts
 */
export function affiliateDisclosureMeta({
  siteDisplayName,
  publisherName = "Unaffiliated Inc.",
}) {
  const description = `How ${siteDisplayName} uses affiliate links, including the Amazon Associates Program.`;
  return {
    title: `Affiliate Disclosure | ${siteDisplayName}`,
    description,
    openGraph: {
      title: `Affiliate Disclosure | ${siteDisplayName}`,
      description,
      url: "/affiliate-disclosure",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Affiliate Disclosure | ${siteDisplayName}`,
      description,
    },
    sections: {
      intro: `${siteDisplayName} (a publication of ${publisherName}) may include links to products and services. Some of those links are affiliate links: if you click and buy, we may earn a commission at no extra cost to you.`,
      amazonHeading: "Amazon Associates",
      amazonBody: `${siteDisplayName} is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com and related sites. As an Amazon Associate, we earn from qualifying purchases.`,
      otherHeading: "Other affiliate partners",
      otherBody: `From time to time we may also participate in other affiliate or partner programs (for example commerce or deal partners). When we do, those relationships will be covered by this disclosure unless a partner requires additional wording on a specific page or email.`,
      editorialHeading: "Editorial independence",
      editorialBody: `Affiliate relationships do not change our editorial standards. We choose what to recommend based on fit for our readers. Product availability, pricing, and terms are controlled by the merchant and can change without notice.`,
      contactHeading: "Questions",
    },
    amazonShortNotice:
      "As an Amazon Associate, we earn from qualifying purchases.",
  };
}
