/**
 * Server-side catalog reads (cached ~5 minutes; see client.js).
 * Every function swallows Storefront errors and returns an empty result so a
 * Shopify hiccup never takes an editorial page down.
 */

import { shopifyFetch } from "./client";
import {
  ALL_PRODUCTS_QUERY,
  COLLECTIONS_QUERY,
  COLLECTION_PRODUCTS_QUERY,
  PRODUCT_BY_HANDLE_QUERY,
  PRODUCT_CARD_FRAGMENT,
  PRODUCT_HANDLES_QUERY,
  PRODUCTS_BY_QUERY,
  VARIANTS_BY_ID_QUERY,
} from "./queries";
import { toCollection, toMoney, toProductCard, toProductDetail } from "./mappers";

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

function warn(where, err) {
  if (process.env.NODE_ENV !== "test") {
    console.warn(`[shopify] ${where}: ${err?.message || err}`);
  }
}

async function paginate(query, variables, pick) {
  const out = [];
  let after = null;
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const data = await shopifyFetch({ query, variables: { ...variables, first: PAGE_SIZE, after } });
    const conn = pick(data);
    if (!conn) break;
    out.push(...(conn.nodes ?? []));
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo.endCursor;
  }
  return out;
}

/** Every product the Online Store publishes. */
export async function getAllProducts() {
  try {
    const nodes = await paginate(ALL_PRODUCTS_QUERY, {}, (d) => d?.products);
    return nodes.map(toProductCard).filter(Boolean);
  } catch (err) {
    warn("getAllProducts", err);
    return [];
  }
}

/** Collections, empty ones dropped. */
export async function getCollections() {
  try {
    const data = await shopifyFetch({ query: COLLECTIONS_QUERY, variables: { first: 50 } });
    return (data?.collections?.nodes ?? []).map(toCollection).filter((c) => c && !c.isEmpty);
  } catch (err) {
    warn("getCollections", err);
    return [];
  }
}

/** Products in one collection, in the merchant's manual order. */
export async function getCollectionProducts(handle) {
  if (!handle) return { collection: null, products: [] };
  try {
    let collection = null;
    const nodes = await paginate(COLLECTION_PRODUCTS_QUERY, { handle }, (d) => {
      if (d?.collection && !collection) {
        collection = toCollection({ ...d.collection, products: { nodes: [{}] } });
      }
      return d?.collection?.products;
    });
    return { collection, products: nodes.map(toProductCard).filter(Boolean) };
  } catch (err) {
    warn(`getCollectionProducts(${handle})`, err);
    return { collection: null, products: [] };
  }
}

/** One product, with variants and gallery. Null when unpublished or unknown. */
export async function getProductByHandle(handle) {
  if (!handle) return null;
  try {
    const data = await shopifyFetch({ query: PRODUCT_BY_HANDLE_QUERY, variables: { handle } });
    return toProductDetail(data?.product);
  } catch (err) {
    warn(`getProductByHandle(${handle})`, err);
    return null;
  }
}

/**
 * Several products by handle, returned in the order asked for. Unknown or
 * unpublished handles are skipped.
 */
export async function getProductsByHandles(handles) {
  const wanted = [
    ...new Set(
      (handles ?? [])
        .filter(Boolean)
        .map((h) => String(h).trim().toLowerCase())
        .filter((h) => /^[a-z0-9][a-z0-9-_]*$/.test(h)),
    ),
  ].slice(0, 24);
  if (wanted.length === 0) return [];
  try {
    // `products(query: "handle:x")` is a prefix match, so look each handle up
    // exactly with aliased product(handle:) fields in one request.
    const fields = wanted.map((h, i) => `p${i}: product(handle: ${JSON.stringify(h)}) { ...ProductCardFields }`);
    const query = `${PRODUCT_CARD_FRAGMENT}\nquery ProductsByHandles { ${fields.join("\n")} }`;
    const data = await shopifyFetch({ query });
    return wanted.map((_, i) => toProductCard(data?.[`p${i}`])).filter(Boolean);
  } catch (err) {
    warn("getProductsByHandles", err);
    return [];
  }
}

/** Free-text search across the published catalog (title, type, vendor). */
export async function searchProducts(term, { first = 24 } = {}) {
  const q = String(term || "").trim();
  if (!q) return [];
  try {
    const safe = q.replace(/["\\]/g, " ");
    const data = await shopifyFetch({
      query: PRODUCTS_BY_QUERY,
      variables: { first, query: `title:*${safe}* OR product_type:*${safe}*` },
      revalidate: 60,
    });
    return (data?.products?.nodes ?? []).map(toProductCard).filter(Boolean);
  } catch (err) {
    warn("searchProducts", err);
    return [];
  }
}

/** Handles + updatedAt for the sitemap. */
export async function getProductHandles() {
  try {
    const nodes = await paginate(PRODUCT_HANDLES_QUERY, {}, (d) => d?.products);
    return nodes.filter((n) => n?.handle).map((n) => ({ handle: n.handle, updatedAt: n.updatedAt || null }));
  } catch (err) {
    warn("getProductHandles", err);
    return [];
  }
}

/** Uncached live price/availability for specific variants. */
export async function getLiveVariants(ids) {
  const wanted = (ids ?? []).filter(Boolean);
  if (wanted.length === 0) return [];
  try {
    const data = await shopifyFetch({ query: VARIANTS_BY_ID_QUERY, variables: { ids: wanted }, revalidate: false });
    return (data?.nodes ?? [])
      .filter((n) => n?.id)
      .map((n) => ({ id: n.id, availableForSale: Boolean(n.availableForSale), price: toMoney(n.price) }));
  } catch (err) {
    warn("getLiveVariants", err);
    return [];
  }
}
