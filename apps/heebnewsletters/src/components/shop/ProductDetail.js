"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import ProductGallery from "./ProductGallery";
import ProductPurchasePanel from "./ProductPurchasePanel";
import styles from "./shop.module.css";

/**
 * Product page body: gallery on the left, buy panel on the right, with the
 * selected variant's image driving the gallery. Description HTML comes
 * straight from Shopify (merchant-authored).
 */
export default function ProductDetail({ product, live, backCollection }) {
  const [activeImage, setActiveImage] = useState(null);
  const onVariantChange = useCallback((variant) => {
    setActiveImage(variant?.image?.url ?? null);
  }, []);

  return (
    <div className={styles.productLayout}>
      <ProductGallery images={product.images} title={product.title} activeUrl={activeImage} />
      <div>
        <p className={styles.crumbs}>
          <Link href="/shop">Shop</Link>
          {backCollection ? (
            <>
              <span aria-hidden>/</span>
              <Link href={`/shop?collection=${encodeURIComponent(backCollection.handle)}`}>{backCollection.title}</Link>
            </>
          ) : null}
        </p>
        <h1 className={styles.productTitle} style={{ margin: "8px 0 16px" }}>
          {product.title}
        </h1>
        <ProductPurchasePanel product={product} live={live} onVariantChange={onVariantChange} />
        {product.descriptionHtml ? (
          <div
            className={styles.description}
            style={{ marginTop: 28 }}
            // Merchant-authored HTML from the Shopify admin.
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        ) : null}
        <p className={styles.metaLinks}>
          <a href={product.storeUrl} target="_blank" rel="noopener noreferrer">
            View on heebmedia.com
          </a>
          <a href="https://heebmedia.com/policies/shipping-policy" target="_blank" rel="noopener noreferrer">
            Shipping
          </a>
          <a href="https://heebmedia.com/policies/refund-policy" target="_blank" rel="noopener noreferrer">
            Returns
          </a>
        </p>
      </div>
    </div>
  );
}
