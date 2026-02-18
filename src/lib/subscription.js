export const BRAND = 'hookuplists';
export const EXECUTE_URL = 'https://magic.hookuplists.com/execute';

export function isRealBrowser() {
  const checks = {
    hasUserAgent: !!navigator.userAgent,
    notHeadless: navigator.webdriver === undefined,
    hasPlugins: navigator.plugins && navigator.plugins.length > 0,
    localStorageWorks: (() => {
      try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        return true;
      } catch (e) {
        return false;
      }
    })(),
    pageVisible: document.visibilityState === 'visible',
    notKnownBot: !/bot|crawler|spider|scanner|preview/i.test(navigator.userAgent),
  };
  return Object.values(checks).filter(Boolean).length >= 4;
}

export async function executeAction(searchParams, action) {
  const encodedEmail = searchParams.get('email');
  if (!encodedEmail) throw new Error('No email');

  const email = decodeURIComponent(encodedEmail);

  const body = { email, brand: BRAND, action };

  const brands = searchParams.get('brands');
  const campaignID = searchParams.get('campaignID');
  const utm_source = searchParams.get('utm_source');
  const utm_campaign = searchParams.get('utm_campaign');
  const articleID = searchParams.get('articleID');

  if (brands) body.brands = brands;
  if (campaignID) body.campaignID = campaignID;
  if (utm_source) body.utm_source = utm_source;
  if (utm_campaign) body.utm_campaign = utm_campaign;
  if (articleID) body.articleID = articleID;

  const response = await fetch(EXECUTE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return response.json();
}
