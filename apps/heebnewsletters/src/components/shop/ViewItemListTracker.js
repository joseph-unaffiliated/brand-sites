"use client";

import { useEffect } from "react";
import { trackViewItemList } from "@/lib/shop-analytics";

/** Fires GA4 view_item_list once for a rendered list. Renders nothing. */
export default function ViewItemListTracker({ products, listName }) {
  useEffect(() => {
    trackViewItemList(products, listName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listName, (products ?? []).map((p) => p.handle).join("|")]);
  return null;
}
