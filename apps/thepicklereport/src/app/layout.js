/**
 * Site chrome: fonts, global ad/pixel loaders (via web-shell), header/footer.
 *
 * Non-technical readers: this wraps every page—the logo bar, subscribe popup, and
 * the legal footer. Day-to-day article text lives in Sanity, not here.
 */

import Link from "next/link";
import { Suspense } from "react";
import BrandLogoMark from "@/components/BrandLogoMark";
import BrandWordmark from "@/components/BrandWordmark";
import { Geist, Geist_Mono } from "next/font/google";
import { FontAwesomeStylesheet, MarketingScripts, TypekitStylesheet } from "@publication-websites/web-shell";
import { siteConfig } from "@/config/site";
import Header from "@/components/Header";
import SubscribePopup from "@/components/SubscribePopup";
import { SubscriberProvider } from "@/context/SubscriberContext";
import "./globals.css";

const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
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

const siteDisplayName =
  process.env.NEXT_PUBLIC_SITE_DISPLAY_NAME || "The Pickle Report";
const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "The World's Leading Pickle News Source. Salty, crunchy, weekly pickle coverage delivered to your inbox.";
const ogImagePath = process.env.NEXT_PUBLIC_SITE_OG_IMAGE;
const faviconPath = process.env.NEXT_PUBLIC_SITE_FAVICON;
const appleIconPath = process.env.NEXT_PUBLIC_SITE_APPLE_ICON;

export const metadata = {
  title: siteDisplayName,
  description: siteDescription,
  icons: faviconPath || appleIconPath
    ? {
        ...(faviconPath ? { icon: faviconPath } : {}),
        ...(appleIconPath ? { apple: appleIconPath } : {}),
      }
    : undefined,
  openGraph: {
    title: siteDisplayName,
    description: siteDescription,
    url: siteUrl,
    siteName: siteDisplayName,
    images: ogImagePath
      ? [{ url: `${siteUrl}${ogImagePath}`, width: 900, height: 600, alt: siteDisplayName }]
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <TypekitStylesheet kitId={siteConfig.typekitKitId} />
        <FontAwesomeStylesheet />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MarketingScripts adsenseClient={ADSENSE_CLIENT} metaPixelId={META_PIXEL_ID} />
        <SubscriberProvider>
          <div className="site">
            <Header />
            <Suspense fallback={null}>
              <SubscribePopup />
            </Suspense>
            <main className="site-main">{children}</main>
          <footer className="site-footer">
            <div className="container footer-grid">
              <div className="footer-brand">
                <Link href="/" className="footer-logo" aria-label="The Pickle Report">
                  <BrandWordmark className="footer-logo-img footer-logo-wordmark" />
                  <BrandLogoMark className="footer-logo-img footer-logo-mark" />
                </Link>
                <p className="footer-text">
                  The world&apos;s leading pickle news source. Delivered weekly.
                </p>
              </div>
              <div>
                <div className="footer-links">
                  <Link href="/archive">Archive</Link>
                  <Link href="/about">About</Link>
                  <Link href="/contact">Contact</Link>
                </div>
              </div>
              <div>
                <div className="footer-links">
                  <Link href="/terms">Terms</Link>
                  <Link href="/privacy">Privacy</Link>
                  <p className="footer-text">
                    © The Pickle Report. 2026.
                  </p>
                </div>
              </div>
            </div>
          </footer>
          </div>
        </SubscriberProvider>
      </body>
    </html>
  );
}
