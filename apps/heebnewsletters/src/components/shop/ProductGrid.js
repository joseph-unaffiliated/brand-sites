import ProductCard from "./ProductCard";
import ProductMosaic from "./ProductMosaic";

/** Product cards in masonry columns (cards keep their natural image height). */
export default function ProductGrid({ products, columns = 4, sizes, priorityCount = 0, quickAdd = true }) {
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
