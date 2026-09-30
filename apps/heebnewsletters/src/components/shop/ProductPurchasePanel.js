"use client";

import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/lib/shopify/mappers";
import { trackViewItem } from "@/lib/shop-analytics";
import AddToCartButton from "./AddToCartButton";
import styles from "./shop.module.css";

/**
 * Option chips → selected variant → live price, availability, quantity and
 * add to cart. `initialVariants` came from the cached catalog read; `live`
 * (uncached price/availability per variant id) overrides it when present.
 */
export default function ProductPurchasePanel({ product, live = [], onVariantChange }) {
  const variants = useMemo(() => {
    const liveById = new Map((live ?? []).map((v) => [v.id, v]));
    return (product.variants ?? []).map((v) => {
      const l = liveById.get(v.id);
      return l ? { ...v, availableForSale: l.availableForSale, price: l.price ?? v.price } : v;
    });
  }, [product.variants, live]);

  const firstAvailable = variants.find((v) => v.availableForSale) ?? variants[0] ?? null;
  const [selection, setSelection] = useState(() =>
    Object.fromEntries((firstAvailable?.selectedOptions ?? []).map((o) => [o.name, o.value])),
  );

  const selected = useMemo(() => {
    if (product.hasOnlyDefaultVariant) return variants[0] ?? null;
    return (
      variants.find((v) => v.selectedOptions.every((o) => selection[o.name] === o.value)) ?? null
    );
  }, [variants, selection, product.hasOnlyDefaultVariant]);

  const [qty, setQty] = useState(1);

  useEffect(() => {
    trackViewItem(product, selected ?? firstAvailable);
    // fire once per product page view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.handle]);

  useEffect(() => {
    onVariantChange?.(selected);
  }, [selected, onVariantChange]);

  const isValueAvailable = (optionName, value) =>
    variants.some(
      (v) =>
        v.availableForSale &&
        v.selectedOptions.some((o) => o.name === optionName && o.value === value) &&
        v.selectedOptions.every((o) => o.name === optionName || selection[o.name] == null || selection[o.name] === o.value),
    );

  const price = selected?.price ?? product.minPrice;
  const compareAt = selected?.compareAtPrice ?? null;
  const available = Boolean(selected?.availableForSale);
  const anyAvailable = variants.some((v) => v.availableForSale);

  return (
    <div className={styles.productInfo}>
      <p className={styles.productPrice}>
        <span>{formatMoney(price)}</span>
        {compareAt && compareAt.amount > (price?.amount ?? 0) ? (
          <span className={styles.compareAt}>{formatMoney(compareAt)}</span>
        ) : null}
        {!anyAvailable ? <span className={styles.soldOut}>Sold out</span> : null}
      </p>

      {!product.hasOnlyDefaultVariant
        ? product.options.map((option) => (
            <div key={option.id || option.name} className={styles.optionGroup}>
              <p className={styles.optionLabel}>
                {option.name}
                {selection[option.name] ? `: ${selection[option.name]}` : ""}
              </p>
              <div className={styles.optionValues} role="radiogroup" aria-label={option.name}>
                {option.values.map((value) => {
                  const active = selection[option.name] === value;
                  const purchasable = isValueAvailable(option.name, value);
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={[
                        styles.optionChip,
                        active ? styles.optionChipActive : "",
                        !purchasable && !active ? styles.optionChipUnavailable : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setSelection((s) => ({ ...s, [option.name]: value }))}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        : null}

      <div className={styles.buyRow}>
        <div className={styles.qty} aria-label="Quantity">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity">
            −
          </button>
          <span aria-live="polite">{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} disabled={qty >= 10} aria-label="Increase quantity">
            +
          </button>
        </div>
        <AddToCartButton
          variantId={selected?.id}
          product={product}
          variant={selected}
          quantity={qty}
          available={available}
          soldOutLabel={selected ? "Sold out" : "Choose options"}
        />
      </div>

      <p className={styles.helper}>
        Shipping, taxes and discount codes are applied at checkout.
      </p>
    </div>
  );
}
