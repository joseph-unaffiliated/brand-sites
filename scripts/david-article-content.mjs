/**
 * David's List — extracted from email issue XML.
 * Run: node scripts/import-david-article.mjs
 * Requires SANITY_API_TOKEN in .env.local (create at sanity.io/manage → API → Tokens, Editor or Admin).
 */

export const davidArticle = {
  _type: "article",
  slug: { _type: "slug", current: "david" },
  title: "David's List",
  kicker: "Hookup Lists",
  subtitle: "Age 42. Male. Straight.",
  summary:
    "Age 42. Male. Straight. From the high-school girlfriend to the D+D accountant—six years, one wife.",
  brandExplainer:
    "Hookup Lists is a weekly chronicle of the highlights (and lowlights) from one person's actual hookup history.",
  photoCredit: "Photo by Talahria Jensen",
  publishedDate: new Date().toISOString(),
  entries: [
    { _type: "articleEntry", age: "Age 15", title: "The High-School girlfriend", body: "The girl I dated for 6 years in high-school. We never actually lost our virginities to each other because we were terrified." },
    { _type: "articleEntry", age: "Age 21", title: "The Tinder Date", body: "We went for Thai food and she jerked me off in the back of her Kia Soul." },
    { _type: "articleEntry", age: "Age 22", title: "The Dishwasher Makeout", body: "We worked at the same restaurant. Eventually we stopped getting put on the same shifts because we kept flirting and getting distracted. We hooked up for a few months. Eventually we grew apart." },
    { _type: "articleEntry", age: "Age 23", title: "The Office Coworker", body: "Met her at my first office job. We dated for about 3 months and then she got back together with her ex when he moved back to the city from Idaho." },
    { _type: "articleEntry", age: "Age 23", title: "The Girl with the Red Hair", body: "Casually dated someone from Tinder for 4 months. She stole my credit card and was the subject of a federal investigation." },
    { _type: "articleEntry", age: "Age 25", title: "The D+D Accountant", body: "My wife, my best friend, my better half. We got married under a massive tree in her parents backyard and I whispered to her something during our vows that no one will ever know but her." },
  ],
  disclaimer:
    "Disclaimer: All names and identifiable details have been modified to protect the reputations of our contributors in the eyes of their partners, colleagues, and parents.",
};
