import Image from "next/image";
import Link from "next/link";
import { formatMoney, formatPriceRange } from "@/lib/shopify/mappers";
import AddToCartButton from "./AddToCartButton";
import styles from "./shop.module.css";

/**
 * One product in a grid or strip. Server-renderable; the optional add-to-cart
 * button is the only client island.
 *
 * `quickAdd`: show "Add to cart" for single-variant products (back issues,
 * stickers). Multi-variant products always link to the product page.
 */
export default function ProductCard({ product, quickAdd = false, sizes = "(max-width: 640px) 50vw, 25vw", priority = false }) {
  if (!product) return null;
  const soldOut = !product.availableForSale;
  const canQuickAdd = quickAdd && !soldOut && product.singleVariantId && !product.hasOptions;

  return (
    <article className={styles.card}>
      {soldOut ? (
        <span className={`${styles.badge} ${styles.badgeMuted}`}>Sold out</span>
      ) : product.compareAtPrice ? (
        <span className={styles.badge}>Sale</span>
      ) : product.isBackIssue ? (
        <span className={styles.badge}>Back issue</span>
      ) : null}
      <Link href={product.url} className={styles.cardLink}>
        <div className={styles.cardImage}>
          {product.image ? (
            <Image
              src={product.image.url}
              alt={product.image.alt || product.title}
              width={product.image.width || 600}
              height={product.image.height || 600}
              sizes={sizes}
              priority={priority}
            />
          ) : null}
        </div>
        <div className={styles.cardBody}>
          <h3 className={styles.cardTitle}>{product.title}</h3>
          <p className={styles.cardPrice}>
            <span>{formatPriceRange(product)}</span>
            {product.compareAtPrice ? (
              <span className={styles.compareAt}>{formatMoney(product.compareAtPrice)}</span>
            ) : null}
          </p>
          {product.note ? <p className={styles.cardNote}>{product.note}</p> : null}
        </div>
      </Link>
      {quickAdd ? (
        <div className={styles.cardActions}>
          {canQuickAdd ? (
            <AddToCartButton
              variantId={product.singleVariantId}
              product={product}
              className="button button-primary"
              label="Add to cart"
            />
          ) : (
            <Link href={product.url} className="button button-secondary" style={{ width: "100%" }}>
              {soldOut ? "View" : "Choose options"}
            </Link>
          )}
        </div>
      ) : null}
    </article>
  );
}
