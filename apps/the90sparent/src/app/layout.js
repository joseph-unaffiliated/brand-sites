/**
 * Site chrome: fonts, global ad/pixel loaders (via web-shell), header/footer.
 *
 * Non-technical readers: this wraps every page—the logo bar, subscribe popup, and
 * the legal footer. Day-to-day article text lives in Sanity, not here.
 *
 * OneTrust + Retention: `ComplianceScripts.js` (override with NEXT_PUBLIC_ONETRUST_DOMAIN_SCRIPT
 * and NEXT_PUBLIC_RETENTION_SITE_ID on Vercel if IDs change).
 *
 * Google Tag Manager: set `NEXT_PUBLIC_GTM_ID` (e.g. `GTM-XXXX`) on Vercel; see `GoogleTagManager.js`.
 * GA4: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` (e.g. `G-XXXX`) on Vercel; see `GoogleAnalytics.js`.
 * Search Console verification is separate: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in metadata.
 */

import Link from "next/link";
import Script from "next/script";
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
import { OneTrustScripts, RetentionScript } from "@/components/ComplianceScripts";
import { GoogleAnalyticsScript } from "@/components/GoogleAnalytics";
import { GoogleTagManagerNoscript, GoogleTagManagerScript } from "@/components/GoogleTagManager";
import Header from "@/components/Header";
import { getArticles, getArticleBySlug } from "@/lib/articles";
import { NavLogoImageProvider } from "@/context/NavLogoImageContext";
import SubscribePopup from "@/components/SubscribePopup";
import SubmissionsCopyLink from "@/components/SubmissionsCopyLink";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
import { SubscriberProvider } from "@/context/SubscriberContext";
import { HouseAdClaimProvider } from "@/context/HouseAdClaimContext";
import { ReaderEventsInit } from "@publication-websites/reader-events";
import EmailClickSession from "@publication-websites/magic-client/email-click-session";
import SubscriberSessionBootstrap from "@publication-websites/magic-client/subscriber-session-bootstrap";
import { headers } from "next/headers";
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
  verification: {
    ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
    ...(bingSiteVerification ? { other: { "msvalidate.01": bingSiteVerification } } : {}),
  },
  other: {
    "google-adsense-account": "ca-pub-2963525366468863",
  },
};

export default async function RootLayout({ children }) {
  let latestIssueImage = null;
  let initialPageFillImage = null;
  try {
    const articles = await getArticles();
    latestIssueImage = articles[0]?.mainImage ?? null;
  } catch {
    /* Sanity optional in dev */
  }

  try {
    const requestHeaders = await headers();
    const articleSlug = requestHeaders.get("x-article-slug");
    if (articleSlug) {
      const article = await getArticleBySlug(articleSlug);
      initialPageFillImage = article?.mainImage ?? null;
    }
  } catch {
    /* Article nav fill optional in dev */
  }

  return (
    <html lang="en">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2963525366468863"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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
          <HouseAdClaimProvider>
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
          <NavLogoImageProvider
            defaultFillImage={latestIssueImage}
            initialPageFillImage={initialPageFillImage}
          >
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
                  <ContactCopyLink email={contactEmail}>Contact</ContactCopyLink>
                  <SubmissionsCopyLink>Submissions</SubmissionsCopyLink>
                  <AdvertiseCopyLink />
                </div>
              </div>
              <div>
                <div className="footer-links">
                  <Link href="/terms">Terms</Link>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/ai-policy">AI Policy</Link>
                  <Link href="/affiliate-disclosure">Affiliate Disclosure</Link>
                  <p className="footer-text">
                    © {siteDisplayName}. 2026.
                  </p>
                </div>
              </div>
            </div>
          </footer>
          </div>
          </NavLogoImageProvider>
          </HouseAdClaimProvider>
        </SubscriberProvider>
      </body>
    </html>
  );
}
