import ProductCard from "./ProductCard";
import ProductMosaic from "./ProductMosaic";
import styles from "./shop.module.css";

/**
 * Product cards in masonry columns (cards keep their natural image height), or
 * with `uniform`, an even grid of cover-cropped, equal-height cards.
 */
export default function ProductGrid({
  products,
  columns = 4,
  sizes,
  priorityCount = 0,
  quickAdd = true,
  uniform = false,
}) {
  if (uniform) {
    return (
      <div className={styles.uniformGrid}>
        {products.map((product, index) => (
          <ProductCard
            key={product.handle}
            product={product}
            quickAdd={quickAdd}
            sizes={sizes}
            priority={index < priorityCount}
          />
        ))}
      </div>
    );
  }
  const items = products.map((product, index) => ({
    key: product.handle,
    aspect:
      product.image?.width && product.image?.height ? product.image.height / product.image.width : 1,
    node: (
      <ProductCard
        product={product}
        quickAdd={quickAdd}
        sizes={sizes}
        priority={index < priorityCount}
      />
    ),
  }));
  return <ProductMosaic items={items} columns={columns} />;
}
