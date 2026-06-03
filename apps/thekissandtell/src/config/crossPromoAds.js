/**
 * The Kiss and Tell cross-promo: The Pickle Report + The '90s Parent image ads.
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
  mid: { brand: "thepicklereport", urlKey: "inArticle" },
  bottom: { brand: "the90sparent", urlKey: "inArticle" },
  rail: { brand: "the90sparent", urlKey: "home" },
  sticky: { brand: "thepicklereport", urlKey: "sticky" },
};

/** @param {"mid" | "bottom" | "rail" | "sticky"} slot */
export function crossPromoForSlot(slot) {
  const { brand, urlKey } = CROSS_PROMO_BY_SLOT[slot];
  return {
    sharedAdsBrand: brand,
    promoUrl: CROSS_PROMO_DESTINATIONS[brand][urlKey],
  };
}
