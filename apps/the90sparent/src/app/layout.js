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
import { ContactCopyLink, ContactCopyToast } from "@publication-websites/web-shell/contact-copy";
import {
  contactEmail,
  siteConfig,
  siteDefaultDescription,
  siteDisplayName,
  siteFooterTagline,
} from "@/config/site";
import Header from "@/components/Header";
import SubscribePopup from "@/components/SubscribePopup";
import SubmissionsCopyLink from "@/components/SubmissionsCopyLink";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
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

const siteDescription =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || siteDefaultDescription;
/** Defaults match `public/tnp-*` brand assets (override per env on Vercel if needed). */
const ogImagePath = process.env.NEXT_PUBLIC_SITE_OG_IMAGE || "/tnp-photo.gif";
const faviconIco = process.env.NEXT_PUBLIC_SITE_FAVICON || "/tnp-favicon.ico";
const faviconPng = process.env.NEXT_PUBLIC_SITE_FAVICON_PNG || "/tnp-favicon.png";
const appleIconPath = process.env.NEXT_PUBLIC_SITE_APPLE_ICON || "/tnp-webclip.png";

export const metadata = {
  title: siteDisplayName,
  description: siteDescription,
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
            <ContactCopyToast />
          <footer className="site-footer">
            <div className="container footer-grid">
              <div className="footer-brand">
                <Link href="/" className="footer-logo" aria-label={siteDisplayName}>
                  <BrandWordmark className="footer-logo-img footer-logo-wordmark" />
                  <BrandLogoMark className="footer-logo-img footer-logo-mark" />
                </Link>
                <p className="footer-text footer-tagline">
                  {siteFooterTagline}
                </p>
              </div>
              <div>
                <div className="footer-links">
                  <Link href="/archive">Archive</Link>
                  <Link href="/about">About</Link>
                  <Link href="/terms">Terms</Link>
                  <Link href="/privacy">Privacy</Link>
                </div>
              </div>
              <div>
                <div className="footer-links">
                  <ContactCopyLink email={contactEmail}>Contact</ContactCopyLink>
                  <SubmissionsCopyLink>Submissions</SubmissionsCopyLink>
                  <AdvertiseCopyLink />
                  <p className="footer-text">
                    © {siteDisplayName}. 2026.
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
