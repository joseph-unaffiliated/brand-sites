import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import ProductGrid from "@/components/shop/ProductGrid";
import ProductDetail from "@/components/shop/ProductDetail";
import { getCollectionProducts, getLiveVariants, getProductByHandle } from "@/lib/shopify/catalog";
import { applyShopFilters, getShopSettings } from "@/lib/shop-content";
import { isNoindex, siteConfig, siteDisplayName } from "@/config/site";
import shop from "@/components/shop/shop.module.css";
import styles from "../page.module.css";

/** Live price/stock per request; the catalog read underneath is still cached. */
export const dynamic = "force-dynamic";

const SITE_URL = siteConfig.siteUrl.replace(/\/$/, "");
const HANDLE_RE = /^[a-z0-9][a-z0-9-_]*$/i;

export async function generateMetadata({ params }) {
  const { handle } = await params;
  if (!HANDLE_RE.test(handle)) return { title: siteDisplayName };
  const product = await getProductByHandle(handle);
  if (!product) return { title: siteDisplayName };
  const title = product.seoTitle || `${product.title} | Shop | ${siteDisplayName}`;
  const description = product.seoDescription || product.description?.slice(0, 160) || `${product.title} from the Heeb shop.`;
  const image = product.image
    ? [{ url: product.image.url, width: product.image.width || 1200, height: product.image.height || 1200, alt: product.title }]
    : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${product.handle}` },
    robots: isNoindex ? { index: false, follow: false } : undefined,
    openGraph: { title, description, url: `/shop/${product.handle}`, type: "website", siteName: siteDisplayName, images: image },
    twitter: { card: "summary_large_image", title, description, images: image ? [image[0].url] : undefined },
  };
}

export default async function ProductPage({ params }) {
  const { handle } = await params;
  if (!HANDLE_RE.test(handle)) notFound();

  const [product, settings] = await Promise.all([getProductByHandle(handle.toLowerCase()), getShopSettings()]);
  if (!product || settings.hidden.includes(product.handle)) notFound();

  const live = await getLiveVariants(product.variants.map((v) => v.id));

  const primaryCollection =
    product.collections.find((c) => c.handle === "back-issues") ||
    product.collections.find((c) => !["shop", "frontpage", "all"].includes(c.handle)) ||
    null;

  let related = [];
  if (primaryCollection) {
    const { products } = await getCollectionProducts(primaryCollection.handle);
    related = applyShopFilters(products, settings)
      .filter((p) => p.handle !== product.handle)
      .slice(0, 4);
  }

  const url = `${SITE_URL}/shop/${product.handle}`;
  const liveById = new Map(live.map((v) => [v.id, v]));
  const offers = product.variants.map((v) => {
    const l = liveById.get(v.id);
    const price = l?.price ?? v.price;
    const available = l ? l.availableForSale : v.availableForSale;
    return {
      "@type": "Offer",
      url,
      priceCurrency: price?.currencyCode || "USD",
      price: price?.amount ?? 0,
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      ...(v.sku ? { sku: v.sku } : {}),
      ...(v.title && v.title !== "Default Title" ? { name: v.title } : {}),
      seller: { "@type": "Organization", name: "Heeb Media", url: "https://heebmedia.com" },
    };
  });

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || undefined,
    image: product.images.map((i) => i.url),
    url,
    brand: { "@type": "Brand", name: "Heeb" },
    ...(product.productType ? { category: product.productType } : {}),
    offers:
      offers.length === 1
        ? offers[0]
        : {
            "@type": "AggregateOffer",
            url,
            priceCurrency: product.minPrice?.currencyCode || "USD",
            lowPrice: product.minPrice?.amount ?? 0,
            highPrice: product.maxPrice?.amount ?? product.minPrice?.amount ?? 0,
            offerCount: offers.length,
            offers,
          },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop` },
      ...(primaryCollection
        ? [{ "@type": "ListItem", position: 3, name: primaryCollection.title, item: `${SITE_URL}/shop?collection=${primaryCollection.handle}` }]
        : []),
      { "@type": "ListItem", position: primaryCollection ? 4 : 3, name: product.title, item: url },
    ],
  };

  return (
    <div className={styles.productPage}>
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="container">
        <ProductDetail product={product} live={live} backCollection={primaryCollection} />

        {related.length > 0 ? (
          <section className={styles.related} aria-label={`More ${primaryCollection.title}`}>
            <h2 className={shop.sectionTitle}>More {primaryCollection.title.toLowerCase()}</h2>
            <ProductGrid products={related} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
