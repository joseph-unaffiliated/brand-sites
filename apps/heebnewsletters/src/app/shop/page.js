import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ProductGrid from "@/components/shop/ProductGrid";
import ViewItemListTracker from "@/components/shop/ViewItemListTracker";
import { getAllProducts, getCollectionProducts, getCollections } from "@/lib/shopify/catalog";
import {
  applyShopFilters,
  getFeaturedProducts,
  getShopSettings,
  pruneEmptyTabs,
  resolveCollectionTabs,
} from "@/lib/shop-content";
import { siteConfig, siteDisplayName } from "@/config/site";
import shop from "@/components/shop/shop.module.css";
import styles from "./page.module.css";

export const revalidate = 300;

const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "");

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const collectionHandle = typeof sp?.collection === "string" ? sp.collection : null;
  const settings = await getShopSettings();
  let title = `${settings.title} | ${siteDisplayName}`;
  let description = settings.intro;
  if (collectionHandle) {
    const { collection } = await getCollectionProducts(collectionHandle);
    if (collection) {
      title = `${collection.title} | ${settings.title} | ${siteDisplayName}`;
      description = collection.description || `${collection.title} from the Heeb shop.`;
    }
  }
  return {
    title,
    description,
    // One canonical for every tab: the tabs are filters, not separate pages.
    alternates: { canonical: "/shop" },
    openGraph: { title, description, url: "/shop", type: "website", siteName: siteDisplayName },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ShopPage({ searchParams }) {
  const sp = await searchParams;
  const requested = typeof sp?.collection === "string" ? sp.collection.toLowerCase() : null;

  const [settings, collections] = await Promise.all([getShopSettings(), getCollections()]);
  const allTabs = resolveCollectionTabs(collections, settings);
  const tabs = await pruneEmptyTabs(allTabs, settings);
  // A pruned (currently empty) collection is still a valid URL, e.g. via the
  // /collections/:handle redirect; it just renders the empty state.
  const activeTab = requested ? allTabs.find((t) => t.handle === requested) ?? null : null;
  if (requested && !activeTab) notFound();

  let products;
  let featured = [];
  if (activeTab) {
    ({ products } = await getCollectionProducts(activeTab.handle));
    products = applyShopFilters(products, settings);
  } else {
    const [all, feat] = await Promise.all([getAllProducts(), getFeaturedProducts(settings, { limit: 4 })]);
    products = applyShopFilters(all, settings);
    featured = feat;
  }

  const listName = activeTab ? `Shop: ${activeTab.title}` : "Shop: all";

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: activeTab ? activeTab.title : settings.title,
    itemListElement: products.slice(0, 50).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}${p.url}`,
      name: p.title,
    })),
  };

  return (
    <div className={styles.page}>
      <JsonLd data={itemListJsonLd} />
      <div className="container">
        <header className="page-header">
          <h1>{activeTab ? activeTab.title : settings.title}</h1>
          <p className={styles.intro}>{activeTab?.description || settings.intro}</p>
        </header>

        {tabs.length > 0 ? (
          <ul className={shop.tabs} aria-label="Collections">
            <li>
              <Link href="/shop" className={`${shop.tab} ${!activeTab ? shop.tabActive : ""}`} aria-current={!activeTab ? "page" : undefined}>
                Everything
              </Link>
            </li>
            {tabs.map((t) => (
              <li key={t.handle}>
                <Link
                  href={`/shop?collection=${encodeURIComponent(t.handle)}`}
                  className={`${shop.tab} ${activeTab?.handle === t.handle ? shop.tabActive : ""}`}
                  aria-current={activeTab?.handle === t.handle ? "page" : undefined}
                >
                  {t.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {!activeTab && featured.length > 0 ? (
          <section className={styles.featured} aria-label="Featured">
            <h2 className={shop.sectionTitle}>Featured</h2>
            <ProductGrid products={featured} priorityCount={2} />
          </section>
        ) : null}

        {products.length > 0 ? (
          <section aria-label={listName}>
            {!activeTab && featured.length > 0 ? <h2 className={shop.sectionTitle}>Everything</h2> : null}
            <ProductGrid products={products} />
            <ViewItemListTracker products={products} listName={listName} />
          </section>
        ) : (
          <p className={styles.empty}>
            Nothing here right now. <Link href="/shop">See everything in the shop.</Link>
          </p>
        )}

        <p className={styles.footnote}>
          The Heeb shop is run by Heeb Media. Orders ship from and are supported by{" "}
          <a href="https://heebmedia.com" target="_blank" rel="noopener noreferrer">
            heebmedia.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
