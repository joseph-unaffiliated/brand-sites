/**
 * The Eyeballer's Cookbook cross-promo: house ads for other network brands only.
 * Never point at theeyeballerscookbook creatives (none exist yet; and hosts shouldn't
 * self-promo). Currently rotates The Pickle Report + The '90s Parent from shared-ads.
 */
export const CROSS_PROMO_DESTINATIONS = {
  the90sparent: {
    home: "https://www.the90sparent.com",
    inArticle: "https://www.the90sparent.com/article/screenanxiety",
    sticky: "https://www.the90sparent.com/article/birthdayparties",
  },
  thepicklereport: {
    home: "https://thepicklereport.com",
    inArticle: "https://thepicklereport.com/article/areligiousloveofpickles",
    sticky: "https://thepicklereport.com/article/biggestplayers",
  },
};

/** @type {Record<string, { brand: keyof typeof CROSS_PROMO_DESTINATIONS, urlKey: keyof typeof CROSS_PROMO_DESTINATIONS.the90sparent }>} */
export const CROSS_PROMO_BY_SLOT = {
  bottom: { brand: "the90sparent", urlKey: "inArticle" },
  rail: { brand: "thepicklereport", urlKey: "home" },
  sticky: { brand: "thepicklereport", urlKey: "sticky" },
};

/** @param {"bottom" | "rail" | "sticky"} slot */
export function crossPromoForSlot(slot) {
  const { brand, urlKey } = CROSS_PROMO_BY_SLOT[slot];
  return {
    sharedAdsBrand: brand,
    promoUrl: CROSS_PROMO_DESTINATIONS[brand][urlKey],
  };
}
