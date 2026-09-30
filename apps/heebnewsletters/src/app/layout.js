/**
 * Site chrome: fonts, global ad/pixel loaders (via web-shell), header/footer.
 *
 * OneTrust + Retention: `ComplianceScripts.js` (OneTrust needs the heebmagazine.com
 * NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT; Retention defaults to the network site id).
 *
 * Google Tag Manager: set `NEXT_PUBLIC_GTM_ID` on Vercel; see `GoogleTagManager.js`.
 * GA4: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` (e.g. `G-XXXX`) on Vercel; see `GoogleAnalytics.js`.
 */

import Link from "next/link";
import { Suspense } from "react";
import BrandWordmark from "@/components/BrandWordmark";
import { Geist, Geist_Mono } from "next/font/google";
import { FontAwesomeStylesheet, MarketingScripts, TypekitStylesheet } from "@publication-websites/web-shell";
import { ContactCopyLink, ContactCopyToast } from "@publication-websites/web-shell/contact-copy";
import {
  contactEmail,
  isNoindex,
  siteConfig,
  siteDefaultDescription,
  siteDisplayName,
} from "@/config/site";
import { OneTrustScripts, RetentionScript } from "@/components/ComplianceScripts";
import { GoogleAnalyticsScript } from "@/components/GoogleAnalytics";
import { GoogleTagManagerNoscript, GoogleTagManagerScript } from "@/components/GoogleTagManager";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
import Header from "@/components/Header";
import SubscribePopup from "@/components/SubscribePopup";
import { SubscriberProvider } from "@/context/SubscriberContext";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/shop/CartDrawer";
import { ReaderEventsInit } from "@publication-websites/reader-events";
import EmailClickSession from "@publication-websites/magic-client/email-click-session";
import SubscriberSessionBootstrap from "@publication-websites/magic-client/subscriber-session-bootstrap";
import "./globals.css";

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = siteConfig.siteUrl;

const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || siteDefaultDescription;
const ogImagePath = process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/heeb-og.png";
const faviconIco = process.env.NEXT_PUBLIC_SITE_FAVICON || "/heeb-favicon.ico";
const faviconPng = process.env.NEXT_PUBLIC_SITE_FAVICON_PNG || "/heeb-favicon.png";
const appleIconPath = process.env.NEXT_PUBLIC_SITE_APPLE_ICON || "/apple-icon.png";

function safeUrl(value) {
  try {
    return value ? new URL(value) : undefined;
  } catch {
    return undefined;
  }
}

const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const bingSiteVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION;

export const metadata = {
  metadataBase: safeUrl(siteUrl),
  title: siteDisplayName,
  description: siteDescription,
  applicationName: siteDisplayName,
  formatDetection: { telephone: false },
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: faviconIco },
      { url: faviconPng, type: "image/png" },
    ],
    ...(appleIconPath ? { apple: appleIconPath } : {}),
  },
  openGraph: {
    title: siteDisplayName,
    description: siteDescription,
    url: siteUrl,
    siteName: siteDisplayName,
    images: ogImagePath
      ? [{ url: `${siteUrl}${ogImagePath}`, width: 1200, height: 630, alt: siteDisplayName }]
      : undefined,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteDisplayName,
    description: siteDescription,
    images: ogImagePath ? [`${siteUrl}${ogImagePath}`] : undefined,
  },
  ...(isNoindex ? { robots: { index: false, follow: false } } : {}),
  verification: {
    ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
    ...(bingSiteVerification ? { other: { "msvalidate.01": bingSiteVerification } } : {}),
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <GoogleTagManagerScript />
        <GoogleAnalyticsScript />
        <OneTrustScripts />
        <TypekitStylesheet kitId={siteConfig.typekitKitId} />
        <FontAwesomeStylesheet />
        <RetentionScript />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <GoogleTagManagerNoscript />
        <MarketingScripts adsenseClient={ADSENSE_CLIENT} metaPixelId={META_PIXEL_ID} />
        <SubscriberProvider>
        <CartProvider>
          <ReaderEventsInit
            brandId={siteConfig.brandId}
            apiOrigin={siteConfig.magicReaderApiOrigin}
          />
          <EmailClickSession
            brand={siteConfig.brandId}
            apiOrigin={siteConfig.magicReaderApiOrigin}
          />
          <SubscriberSessionBootstrap
            brand={siteConfig.brandId}
            apiOrigin={siteConfig.magicReaderApiOrigin}
          />
          <div className="site">
            <Header />
            <Suspense fallback={null}>
              <SubscribePopup />
            </Suspense>
            <main className="site-main">{children}</main>
            <ContactCopyToast />
            <CartDrawer />
            <footer className="site-footer">
              <div className="container footer-grid">
                <div className="footer-brand">
                  <Link href="/" className="footer-logo" aria-label={siteDisplayName}>
                    <BrandWordmark className="footer-logo-img footer-logo-wordmark" />
                  </Link>
                </div>
                <div>
                  <div className="footer-links">
                    <Link href="/from-the-vault">From the Vault</Link>
                    <Link href="/shop">Shop</Link>
                    <Link href="/about">About</Link>
                    <Link href="/terms">Terms</Link>
                    <Link href="/privacy">Policy</Link>
                    <Link href="/affiliate-disclosure">Affiliate</Link>
                    <Link href="/ai-policy">AI Policy</Link>
                  </div>
                </div>
                <div>
                  <div className="footer-links">
                    <ContactCopyLink email={contactEmail}>Contact</ContactCopyLink>
                    <AdvertiseCopyLink />
                    <p className="footer-text">© {siteDisplayName}. 2026.</p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </CartProvider>
        </SubscriberProvider>
      </body>
    </html>
  );
}
