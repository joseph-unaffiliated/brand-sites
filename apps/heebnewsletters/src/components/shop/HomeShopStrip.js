import Link from "next/link";
import { getFeaturedProducts, getShopSettings } from "@/lib/shop-content";
import ProductGrid from "./ProductGrid";
import ViewItemListTracker from "./ViewItemListTracker";
import styles from "./shop.module.css";

/** Homepage strip: featured products from Sanity, or the first back issues. */
export default async function HomeShopStrip() {
  const settings = await getShopSettings();
  const products = await getFeaturedProducts(settings, { limit: 4 });
  if (products.length === 0) return null;

  return (
    <section className={styles.homeStrip} aria-label={settings.featuredTitle}>
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{settings.featuredTitle}</h2>
          <Link href="/shop" className={styles.sectionMore}>
            Shop everything
          </Link>
        </div>
        <ProductGrid products={products} />
        <ViewItemListTracker products={products} listName="Homepage: featured" />
      </div>
    </section>
  );
}
