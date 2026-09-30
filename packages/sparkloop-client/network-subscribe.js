/**
 * Subscribe a reader to another brand in our network via that brand's magic /execute.
 * `sourceBrand` becomes utm_source → subSource, which analytics buckets as cross-pollination.
 *
 * @param {{ executeUrl: string, brandId: string, email: string, sourceBrand: string }} opts
 */
export async function subscribeToNetworkBrand({ executeUrl, brandId, email, sourceBrand }) {
  const response = await fetch(executeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      brand: brandId,
      action: "subscribe",
      utm_source: sourceBrand,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Subscribe to ${brandId} failed (${response.status})`);
  }
  return data;
}

/**
 * @param {string} signupUrl magic base, e.g. https://magic.hardresets.com/
 */
export function executeUrlFromSignupUrl(signupUrl) {
  return new URL("execute", signupUrl).toString();
}
