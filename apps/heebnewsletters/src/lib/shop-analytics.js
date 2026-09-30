/**
 * Ecommerce events for the on-site shop: GA4 (gtag) and Meta Pixel (fbq).
 *
 * Consent: OneTrust gates the tag loaders themselves (GoogleAnalytics.js and
 * web-shell's MarketingScripts), so when a reader hasn't consented `gtag` /
 * `fbq` are simply undefined and these helpers no-op. Same guard pattern as
 * the subscription events in /subscribed.
 *
 * Purchases complete in heebmedia.com's checkout, so nothing past
 * `begin_checkout` fires here; orders are attributed by the cart's
 * `source=heebmagazine.com` attribute and the checkout UTM parameters.
 */

const CURRENCY = "USD";

function gtagEvent(name, params) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params);
  } catch {
    // never let analytics break the shop
  }
}

function fbqTrack(name, params) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("track", name, params);
  } catch {
    // ignore
  }
}

function money(m) {
  return m && Number.isFinite(m.amount) ? Number(m.amount.toFixed(2)) : 0;
}

/** GA4 item from a product card or a cart line. */
export function gaItem(product, { variantTitle, quantity = 1, price, index, listName } = {}) {
  if (!product) return null;
  const unit = money(price ?? product.minPrice);
  return {
    item_id: product.handle || product.productHandle || product.id,
    item_name: product.title || product.productTitle || "",
    item_brand: "Heeb",
    item_category: product.productType || "",
    ...(variantTitle ? { item_variant: variantTitle } : {}),
    ...(listName ? { item_list_name: listName } : {}),
    ...(index != null ? { index } : {}),
    price: unit,
    quantity,
  };
}

export function trackViewItemList(products, listName) {
  const items = (products ?? []).map((p, i) => gaItem(p, { index: i, listName })).filter(Boolean);
  if (items.length === 0) return;
  gtagEvent("view_item_list", { item_list_name: listName, items });
}

export function trackViewItem(product, variant) {
  if (!product) return;
  const price = variant?.price ?? product.minPrice;
  const item = gaItem(product, { variantTitle: variant?.title, price });
  gtagEvent("view_item", { currency: CURRENCY, value: money(price), items: [item] });
  fbqTrack("ViewContent", {
    content_type: "product",
    content_ids: [product.handle],
    content_name: product.title,
    value: money(price),
    currency: CURRENCY,
  });
}

export function trackAddToCart(product, variant, quantity = 1) {
  if (!product) return;
  const price = variant?.price ?? product.minPrice;
  const item = gaItem(product, { variantTitle: variant?.title, price, quantity });
  const value = money(price) * quantity;
  gtagEvent("add_to_cart", { currency: CURRENCY, value, items: [item] });
  fbqTrack("AddToCart", {
    content_type: "product",
    content_ids: [product.handle],
    content_name: product.title,
    value,
    currency: CURRENCY,
  });
}

export function trackRemoveFromCart(line) {
  if (!line) return;
  const item = gaItem(
    { handle: line.productHandle, title: line.productTitle, productType: line.productType },
    { variantTitle: line.variantTitle, price: line.price, quantity: line.quantity },
  );
  gtagEvent("remove_from_cart", { currency: CURRENCY, value: money(line.price) * line.quantity, items: [item] });
}

export function trackViewCart(cart) {
  if (!cart?.lines?.length) return;
  gtagEvent("view_cart", { currency: CURRENCY, value: money(cart.subtotal), items: cartItems(cart) });
}

export function trackBeginCheckout(cart) {
  if (!cart?.lines?.length) return;
  const items = cartItems(cart);
  gtagEvent("begin_checkout", { currency: CURRENCY, value: money(cart.subtotal), items });
  fbqTrack("InitiateCheckout", {
    content_type: "product",
    content_ids: cart.lines.map((l) => l.productHandle).filter(Boolean),
    num_items: cart.totalQuantity,
    value: money(cart.subtotal),
    currency: CURRENCY,
  });
}

function cartItems(cart) {
  return (cart.lines ?? [])
    .map((line) =>
      gaItem(
        { handle: line.productHandle, title: line.productTitle, productType: line.productType },
        { variantTitle: line.variantTitle, price: line.price, quantity: line.quantity },
      ),
    )
    .filter(Boolean);
}
