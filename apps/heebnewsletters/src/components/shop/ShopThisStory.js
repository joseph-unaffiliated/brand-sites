import Link from "next/link";
import ProductCard from "./ProductCard";
import ViewItemListTracker from "./ViewItemListTracker";
import styles from "./shop.module.css";

/**
 * Under an article: the back issue the story ran in (auto, from
 * `originalIssueUrl`) plus any editor picks. Renders nothing when there are
 * no products, so the page can fall back to the text link.
 */
export default function ShopThisStory({ products, title = "Shop this story", issueTitle }) {
  if (!products?.length) return null;
  const listName = `Shop this story: ${issueTitle || ""}`.trim();
  return (
    <section className={styles.storyShop} aria-label={title}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <Link href="/shop" className={styles.sectionMore}>
          Visit the shop
        </Link>
      </div>
      <div className={styles.storyGrid}>
        {products.map((p) => (
          <ProductCard key={p.handle} product={p} quickAdd sizes="(max-width: 720px) 50vw, 240px" />
        ))}
      </div>
      <ViewItemListTracker products={products} listName={listName} />
    </section>
  );
}
