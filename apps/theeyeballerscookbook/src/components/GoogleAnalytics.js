import Script from "next/script";

const DEFAULT_GA_MEASUREMENT_ID = "G-L5VEGPHYGS";
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_MEASUREMENT_ID;

/**
 * GA4 measurement tag (gtag.js). Defaults to Eyeballer's property; override with
 * NEXT_PUBLIC_GA_MEASUREMENT_ID on Vercel if needed.
 * Do not also fire the same Measurement ID from GTM — that double-counts page views.
 */
export function GoogleAnalyticsScript() {
  if (!GA_MEASUREMENT_ID) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
