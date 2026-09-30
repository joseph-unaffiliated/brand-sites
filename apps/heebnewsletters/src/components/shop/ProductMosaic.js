"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./shop.module.css";

/** Card body (title, price, button) height as a fraction of card width. */
const CARD_BODY_ESTIMATE = 0.75;

function responsiveColumns(max) {
  if (window.matchMedia("(max-width: 640px)").matches) return Math.min(max, 2);
  if (window.matchMedia("(max-width: 1024px)").matches) return Math.min(max, 3);
  return max;
}

/** Shortest-column-first, so list order still reads across rows. */
function pack(items, count) {
  const columns = Array.from({ length: count }, () => ({ height: 0, items: [] }));
  items.forEach((item, order) => {
    const target = columns.reduce((min, col) => (col.height < min.height ? col : min), columns[0]);
    target.items.push({ ...item, order });
    target.height += item.aspect + CARD_BODY_ESTIMATE;
  });
  return columns.map((col) => col.items);
}

/**
 * Masonry columns for server-rendered cards: `items` are `{ key, aspect, node }`
 * where `aspect` is image height / width. Before hydration, narrow screens fall
 * back to a plain grid in list order (see `.mosaic:not([data-cols])`).
 */
export default function ProductMosaic({ items, columns = 4 }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    const update = () => setCount(responsiveColumns(columns));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [columns]);

  const packed = useMemo(() => pack(items, count ?? columns), [items, count, columns]);

  return (
    <div className={styles.mosaic} data-cols={count ?? undefined}>
      {packed.map((column, index) => (
        <div key={index} className={styles.mosaicColumn}>
          {column.map((item) => (
            <div key={item.key} className={styles.mosaicItem} style={{ order: item.order }}>
              {item.node}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
