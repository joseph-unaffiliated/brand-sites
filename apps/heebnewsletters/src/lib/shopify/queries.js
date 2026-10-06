/**
 * Storefront API documents. Kept small so every query stays well under the
 * tokenless query-cost limit (1,000 per request).
 */

export const IMAGE_FRAGMENT = `
  fragment ImageFields on Image {
    url
    width
    height
    altText
  }
`;

export const MONEY_FRAGMENT = `
  fragment MoneyFields on MoneyV2 {
    amount
    currencyCode
  }
`;

/** Listing card: what the grid, strips and story cards need. */
export const PRODUCT_CARD_FRAGMENT = `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  fragment ProductCardFields on Product {
    id
    handle
    title
    productType
    vendor
    availableForSale
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFields }
    }
    featuredImage { ...ImageFields }
    variantPeek: variants(first: 2) {
      nodes { id availableForSale }
    }
  }
`;

/** Product page: gallery, options and every variant. */
export const PRODUCT_DETAIL_FRAGMENT = `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  fragment ProductDetailFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    vendor
    availableForSale
    updatedAt
    onlineStoreUrl
    seo { title description }
    priceRange {
      minVariantPrice { ...MoneyFields }
      maxVariantPrice { ...MoneyFields }
    }
    compareAtPriceRange {
      minVariantPrice { ...MoneyFields }
    }
    featuredImage { ...ImageFields }
    images(first: 10) { nodes { ...ImageFields } }
    options { id name optionValues { id name } }
    variants(first: 100) {
      nodes {
        id
        title
        sku
        availableForSale
        price { ...MoneyFields }
        compareAtPrice { ...MoneyFields }
        selectedOptions { name value }
        image { ...ImageFields }
      }
    }
    collections(first: 10) { nodes { handle title } }
  }
`;

export const ALL_PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query AllProducts($first: Int!, $after: String) {
    products(first: $first, after: $after, sortKey: BEST_SELLING) {
      pageInfo { hasNextPage endCursor }
      nodes { ...ProductCardFields }
    }
  }
`;

export const PRODUCTS_BY_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query ProductsByQuery($first: Int!, $query: String!) {
    products(first: $first, query: $query) {
      nodes { ...ProductCardFields }
    }
  }
`;

export const COLLECTIONS_QUERY = `
  ${IMAGE_FRAGMENT}
  query Collections($first: Int!) {
    collections(first: $first) {
      nodes {
        id
        handle
        title
        description
        image { ...ImageFields }
        products(first: 1) { nodes { id } }
      }
    }
  }
`;

export const COLLECTION_PRODUCTS_QUERY = `
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionProducts($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      products(first: $first, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { ...ProductCardFields }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  ${PRODUCT_DETAIL_FRAGMENT}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) { ...ProductDetailFields }
  }
`;

export const PRODUCT_HANDLES_QUERY = `
  query ProductHandles($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
    }
  }
`;

/** Live price/availability for a set of variants (product page + cart refresh). */
export const VARIANTS_BY_ID_QUERY = `
  ${MONEY_FRAGMENT}
  query VariantsById($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        availableForSale
        price { ...MoneyFields }
      }
    }
  }
`;

/* ---------- Cart (browser-side) ---------- */

export const CART_FRAGMENT = `
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    attributes { key value }
    buyerIdentity { email }
    cost {
      subtotalAmount { ...MoneyFields }
      totalAmount { ...MoneyFields }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { ...MoneyFields } }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            price { ...MoneyFields }
            selectedOptions { name value }
            image { ...ImageFields }
            product { id handle title productType featuredImage { ...ImageFields } }
          }
        }
      }
    }
  }
`;

export const CART_QUERY = `
  ${CART_FRAGMENT}
  query Cart($id: ID!) {
    cart(id: $id) { ...CartFields }
  }
`;

export const CART_CREATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

/** Checkout pre-fills Contact with `buyerIdentity.email`. */
export const CART_BUYER_IDENTITY_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;

export const CART_ATTRIBUTES_UPDATE_MUTATION = `
  ${CART_FRAGMENT}
  mutation CartAttributesUpdate($cartId: ID!, $attributes: [AttributeInput!]!) {
    cartAttributesUpdate(cartId: $cartId, attributes: $attributes) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
`;
