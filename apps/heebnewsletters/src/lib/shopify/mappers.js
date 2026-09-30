/**
 * Normalize Storefront API nodes into the plain shapes the UI renders.
 * Everything here is serializable so server components can hand it to
 * client components.
 */

import { SHOPIFY_STORE_URL } from "./client";

const PRODUCT_URL_RE = /\/products\/([a-z0-9][a-z0-9-_]*)/i;

/**
 * `https://heebmedia.com/products/heeb-12?pr_prod_strat=…` → `heeb-12`.
 * Anything that isn't a product URL (collections, blog posts) returns null.
 */
export function productHandleFromUrl(url) {
  if (!url || typeof url !== "string") return null;
  let pathname = url;
  try {
    pathname = new URL(url, SHOPIFY_STORE_URL).pathname;
  } catch {
    // relative or malformed: fall through and regex the raw string
  }
  const m = PRODUCT_URL_RE.exec(pathname);
  return m ? m[1].toLowerCase() : null;
}

export function toMoney(node) {
  if (!node || node.amount == null) return null;
  const amount = Number(node.amount);
  return {
    amount: Number.isFinite(amount) ? amount : 0,
    currencyCode: node.currencyCode || "USD",
  };
}

export function formatMoney(money, { trimZeros = true } = {}) {
  if (!money) return "";
  const { amount, currencyCode = "USD" } = money;
  const fractionDigits = trimZeros && Number.isInteger(amount) ? 0 : 2;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(fractionDigits)}`;
  }
}

/** "$29" or "$18 – $126" for a product's price range. */
export function formatPriceRange(product) {
  if (!product?.minPrice) return "";
  const min = formatMoney(product.minPrice);
  if (product.maxPrice && product.maxPrice.amount > product.minPrice.amount) {
    return `${min} – ${formatMoney(product.maxPrice)}`;
  }
  return min;
}

export function toImage(node) {
  if (!node?.url) return null;
  return {
    url: node.url,
    width: node.width || null,
    height: node.height || null,
    alt: node.altText || "",
  };
}

function toVariant(node) {
  if (!node?.id) return null;
  return {
    id: node.id,
    title: node.title || "",
    sku: node.sku || null,
    availableForSale: Boolean(node.availableForSale),
    price: toMoney(node.price),
    compareAtPrice: toMoney(node.compareAtPrice),
    selectedOptions: Array.isArray(node.selectedOptions)
      ? node.selectedOptions.map((o) => ({ name: o.name, value: o.value }))
      : [],
    image: toImage(node.image),
  };
}

/** Card-level product (grid, strips, story cards). */
export function toProductCard(node) {
  if (!node?.handle) return null;
  const minPrice = toMoney(node.priceRange?.minVariantPrice);
  const maxPrice = toMoney(node.priceRange?.maxVariantPrice);
  const compareAt = toMoney(node.compareAtPriceRange?.minVariantPrice);
  const peek = node.variantPeek?.nodes ?? node.variants?.nodes ?? [];
  const firstVariant = peek[0] ?? null;
  return {
    id: node.id,
    handle: node.handle,
    title: node.title || node.handle,
    productType: node.productType || "",
    vendor: node.vendor || "",
    availableForSale: Boolean(node.availableForSale),
    minPrice,
    maxPrice,
    compareAtPrice: compareAt && minPrice && compareAt.amount > minPrice.amount ? compareAt : null,
    image: toImage(node.featuredImage),
    /** More than one variant: the shopper must choose on the product page. */
    hasOptions: peek.length > 1,
    /** Only meaningful when the product has one variant (e.g. a back issue). */
    singleVariantId: peek.length === 1 ? firstVariant?.id ?? null : null,
    url: `/shop/${node.handle}`,
  };
}

/** Full product (product page). */
export function toProductDetail(node) {
  const card = toProductCard(node);
  if (!card) return null;
  const variants = (node.variants?.nodes ?? []).map(toVariant).filter(Boolean);
  const images = (node.images?.nodes ?? []).map(toImage).filter(Boolean);
  if (images.length === 0 && card.image) images.push(card.image);
  const options = (node.options ?? [])
    .map((o) => ({
      id: o.id,
      name: o.name,
      values: (o.optionValues ?? []).map((v) => v.name).filter(Boolean),
    }))
    // Shopify's placeholder option for single-variant products.
    .filter((o) => !(o.name === "Title" && o.values.length === 1 && o.values[0] === "Default Title"));
  return {
    ...card,
    description: node.description || "",
    descriptionHtml: node.descriptionHtml || "",
    seoTitle: node.seo?.title || null,
    seoDescription: node.seo?.description || null,
    updatedAt: node.updatedAt || null,
    storeUrl: node.onlineStoreUrl || `${SHOPIFY_STORE_URL}/products/${node.handle}`,
    images,
    options,
    variants,
    hasOnlyDefaultVariant: options.length === 0 && variants.length === 1,
    collections: (node.collections?.nodes ?? []).map((c) => ({ handle: c.handle, title: c.title })),
  };
}

export function toCollection(node) {
  if (!node?.handle) return null;
  return {
    id: node.id,
    handle: node.handle,
    title: node.title || node.handle,
    description: node.description || "",
    image: toImage(node.image),
    isEmpty: Array.isArray(node.products?.nodes) ? node.products.nodes.length === 0 : false,
  };
}

/** Cart, for the drawer. */
export function toCart(node) {
  if (!node?.id) return null;
  const lines = (node.lines?.nodes ?? [])
    .map((line) => {
      const m = line.merchandise;
      if (!m?.id) return null;
      return {
        id: line.id,
        quantity: line.quantity,
        total: toMoney(line.cost?.totalAmount),
        variantId: m.id,
        variantTitle: m.title === "Default Title" ? "" : m.title || "",
        availableForSale: Boolean(m.availableForSale),
        price: toMoney(m.price),
        selectedOptions: (m.selectedOptions ?? []).filter((o) => o.name !== "Title"),
        image: toImage(m.image) || toImage(m.product?.featuredImage),
        productId: m.product?.id ?? null,
        productHandle: m.product?.handle ?? null,
        productTitle: m.product?.title ?? "",
        productType: m.product?.productType ?? "",
      };
    })
    .filter(Boolean);
  return {
    id: node.id,
    checkoutUrl: node.checkoutUrl,
    totalQuantity: node.totalQuantity ?? lines.reduce((n, l) => n + l.quantity, 0),
    subtotal: toMoney(node.cost?.subtotalAmount),
    total: toMoney(node.cost?.totalAmount),
    attributes: node.attributes ?? [],
    lines,
  };
}
