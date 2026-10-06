/**
 * Browser-side cart calls. These go straight from the shopper's browser to
 * Shopify (the tokenless Storefront API allows any origin), so Shopify's
 * per-IP rate limits apply per shopper rather than to our servers.
 */

import { CART_SOURCE_ATTRIBUTE, SHOPIFY_STOREFRONT_ENDPOINT, ShopifyError } from "./client";
import { toCart } from "./mappers";
import {
  CART_ATTRIBUTES_UPDATE_MUTATION,
  CART_BUYER_IDENTITY_UPDATE_MUTATION,
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_QUERY,
} from "./queries";

export const CART_ID_STORAGE_KEY = "heebmagazine.cartId";

/** UTM tags added to the heebmedia.com checkout URL so GA there can see us. */
const CHECKOUT_UTM = { utm_source: "heebmagazine.com", utm_medium: "referral", utm_campaign: "shop" };

async function gql(query, variables) {
  const res = await fetch(SHOPIFY_STOREFRONT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ShopifyError(`Storefront API ${res.status}`, { status: res.status, errors: json?.errors });
  if (json?.errors?.length && !json?.data) {
    throw new ShopifyError(json.errors[0]?.message || "Storefront API error", { errors: json.errors });
  }
  return json?.data ?? null;
}

function unwrap(payload) {
  const errors = payload?.userErrors ?? [];
  if (errors.length) throw new ShopifyError(errors.map((e) => e.message).join(" "), { errors });
  return toCart(payload?.cart);
}

export function readStoredCartId() {
  try {
    return window.localStorage.getItem(CART_ID_STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function storeCartId(id) {
  try {
    if (id) window.localStorage.setItem(CART_ID_STORAGE_KEY, id);
    else window.localStorage.removeItem(CART_ID_STORAGE_KEY);
  } catch {
    // private mode etc.
  }
}

export async function fetchCart(id) {
  if (!id) return null;
  const data = await gql(CART_QUERY, { id });
  return toCart(data?.cart);
}

export async function createCart(lines = []) {
  const data = await gql(CART_CREATE_MUTATION, {
    input: { lines, attributes: [CART_SOURCE_ATTRIBUTE] },
  });
  return unwrap(data?.cartCreate);
}

export async function addLines(cartId, lines) {
  const data = await gql(CART_LINES_ADD_MUTATION, { cartId, lines });
  return unwrap(data?.cartLinesAdd);
}

export async function updateLines(cartId, lines) {
  const data = await gql(CART_LINES_UPDATE_MUTATION, { cartId, lines });
  return unwrap(data?.cartLinesUpdate);
}

export async function removeLines(cartId, lineIds) {
  const data = await gql(CART_LINES_REMOVE_MUTATION, { cartId, lineIds });
  return unwrap(data?.cartLinesRemove);
}

export async function setBuyerEmail(cartId, email) {
  const data = await gql(CART_BUYER_IDENTITY_UPDATE_MUTATION, { cartId, buyerIdentity: { email } });
  return unwrap(data?.cartBuyerIdentityUpdate);
}

/** Older carts (or ones Shopify recreated) may lack the source attribute. */
export async function ensureSourceAttribute(cart) {
  if (!cart?.id) return cart;
  const has = (cart.attributes ?? []).some(
    (a) => a.key === CART_SOURCE_ATTRIBUTE.key && a.value === CART_SOURCE_ATTRIBUTE.value,
  );
  if (has) return cart;
  const data = await gql(CART_ATTRIBUTES_UPDATE_MUTATION, {
    cartId: cart.id,
    attributes: [CART_SOURCE_ATTRIBUTE],
  });
  return unwrap(data?.cartAttributesUpdate);
}

/** checkoutUrl with UTM parameters appended (keeps Shopify's own `key`). */
export function checkoutUrlWithUtm(checkoutUrl) {
  if (!checkoutUrl) return null;
  try {
    const url = new URL(checkoutUrl);
    for (const [k, v] of Object.entries(CHECKOUT_UTM)) {
      if (!url.searchParams.has(k)) url.searchParams.set(k, v);
    }
    return url.toString();
  } catch {
    return checkoutUrl;
  }
}
