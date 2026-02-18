import Image from "next/image";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Hookup Lists",
  description: "Hookup Lists is an editorial newsletter series.",
  icons: {
    icon: "/hl-favicon.png",
    apple: "/hl-webclip.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/xon1hcs.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="site">
          <header className="site-header">
            <div className="container">
              <nav className="site-nav site-nav-left">
                <Link href="/archive">Archive</Link>
                <Link href="/about">About</Link>
              </nav>
              <div className="brand">
                <Link href="/" className="brand-name">
                  <Image
                    src="/hl-logo-black.png"
                    alt="Hookup Lists"
                    width={64}
                    height={64}
                    priority
                  />
                </Link>
              </div>
              <nav className="site-nav site-nav-right">
                <Link href="/contact">Contact</Link>
                <a className="button button-secondary" href="/#subscribe">
                  Subscribe
                </a>
              </nav>
            </div>
          </header>
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <div className="container footer-grid">
              <div className="footer-brand">
                <Image
                  src="/hl-logo-white.png"
                  alt="Hookup Lists"
                  width={40}
                  height={40}
                  className="footer-logo"
                />
                <p className="footer-title">Hookup Lists</p>
                <p className="footer-text">
                  Stories to make your inner 13 y/o blush. Delivered weekly.
                </p>
              </div>
              <div>
                <p className="footer-title">Explore</p>
                <div className="footer-links">
                  <Link href="/archive">Archive</Link>
                  <Link href="/about">About</Link>
                  <Link href="/contact">Contact</Link>
                </div>
              </div>
              <div>
                <p className="footer-title">Legal</p>
                <div className="footer-links">
                  <Link href="/terms">Terms</Link>
                  <Link href="/privacy">Privacy</Link>
                </div>
              </div>
              <div>
                <p className="footer-title">Contact</p>
                <div className="footer-links">
                  <a href="mailto:contact@hookuplists.com">
                    contact@hookuplists.com
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
