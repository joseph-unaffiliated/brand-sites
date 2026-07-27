/**
 * House-ad rotation for cross_promo mode: never self-promote. Rotates other
 * Unaffiliated brands only (mirrors Hipspeak / Hard Resets).
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

export const CROSS_PROMO_BY_SLOT = {
  bottom: { brand: "thepicklereport", urlKey: "inArticle" },
  rail: { brand: "the90sparent", urlKey: "home" },
  sticky: { brand: "the90sparent", urlKey: "sticky" },
};

export function crossPromoForSlot(slot) {
  const { brand, urlKey } = CROSS_PROMO_BY_SLOT[slot];
  return {
    sharedAdsBrand: brand,
    promoUrl: CROSS_PROMO_DESTINATIONS[brand][urlKey],
  };
}
