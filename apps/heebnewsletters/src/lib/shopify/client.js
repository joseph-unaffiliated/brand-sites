/**
 * Tokenless Shopify Storefront API client for the Heeb Media store.
 *
 * heebmagazine.com is a second storefront for the same Shopify store that runs
 * heebmedia.com. It reads the catalog and creates carts through Shopify's
 * tokenless Storefront API (no Headless channel, no access token, nothing
 * installed on the Heeb Media admin). Checkout stays on heebmedia.com.
 *
 * What tokenless allows: published products, collections, search, carts.
 * What it doesn't: inventory counts, product tags, metafields, customer data.
 *
 * Only one non-secret setting: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.
 */

export const SHOPIFY_STORE_DOMAIN =
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN?.trim() || "303ed7-79.myshopify.com";

export const SHOPIFY_API_VERSION =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_VERSION?.trim() || "2026-07";

export const SHOPIFY_STOREFRONT_ENDPOINT = `https://${SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

/** Public-facing store where checkout happens. */
export const SHOPIFY_STORE_URL = "https://heebmedia.com";

/** Cart attribute so heebmagazine.com orders are identifiable in the Heeb Media admin. */
export const CART_SOURCE_ATTRIBUTE = { key: "source", value: "heebmagazine.com" };

/** Catalog reads are cached this long on the server (no webhooks without admin access). */
export const CATALOG_REVALIDATE_SECONDS = 300;

export class ShopifyError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = "ShopifyError";
    this.status = status ?? null;
    this.errors = errors ?? null;
  }
}

/**
 * POST a GraphQL document to the Storefront API.
 *
 * @param {{ query: string; variables?: Record<string, unknown>; revalidate?: number | false; tags?: string[] }} opts
 * @returns {Promise<any>} `data` from the GraphQL response
 */
export async function shopifyFetch({ query, variables, revalidate = CATALOG_REVALIDATE_SECONDS, tags }) {
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables: variables ?? {} }),
  };
  if (revalidate === false) init.cache = "no-store";
  else init.next = { revalidate, ...(tags ? { tags } : {}) };

  const res = await fetch(SHOPIFY_STOREFRONT_ENDPOINT, init);
  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw new ShopifyError(`Storefront API ${res.status}`, { status: res.status, errors: json?.errors });
  }
  if (json?.errors?.length && !json?.data) {
    throw new ShopifyError(json.errors[0]?.message || "Storefront API error", { errors: json.errors });
  }
  return json?.data ?? null;
}
