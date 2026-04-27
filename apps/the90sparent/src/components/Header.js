"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSubscriber } from "@/context/SubscriberContext";
import BrandLogoMark from "@/components/BrandLogoMark";
import BrandWordmark from "@/components/BrandWordmark";
import ContactCopyLink from "@/components/ContactCopyLink";
import SubmissionsCopyLink from "@/components/SubmissionsCopyLink";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
import { siteDisplayName } from "@/config/site";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isSubscribed } = useSubscriber();

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const subscribeDesktop = (
    <a className="button button-secondary" href="/#subscribe">
      Subscribe
    </a>
  );

  const subscribeMobile = (
    <a
      className="button button-secondary header-subscribe-mobile"
      href="/#subscribe"
      onClick={() => setMenuOpen(false)}
    >
      Subscribe
    </a>
  );

  return (
    <header className="site-header">
      <div className="header-row-1 container">
        <button
          type="button"
          className="header-hamburger"
          aria-expanded={menuOpen}
          aria-controls="header-drawer"
          aria-label="Toggle menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="header-hamburger-line" aria-hidden />
        </button>
        <nav className="site-nav site-nav-left header-nav-desktop" aria-label="Main">
          <Link href="/archive">Archive</Link>
          {!isSubscribed && (
            <>
              <Link href="/about">About</Link>
              <SubmissionsCopyLink />
            </>
          )}
        </nav>
        <div className="brand">
          <Link
            href="/"
            className="brand-name"
            onClick={() => setMenuOpen(false)}
            aria-label={siteDisplayName}
          >
            <BrandWordmark className="brand-logo-img brand-logo-wordmark" />
            <BrandLogoMark className="brand-logo-img brand-logo-mark" />
          </Link>
        </div>
        <nav className="site-nav site-nav-right header-nav-desktop" aria-label="Main">
          {isSubscribed ? (
            <Link href="/about">About</Link>
          ) : (
            subscribeDesktop
          )}
        </nav>
        {!isSubscribed ? subscribeMobile : null}
      </div>
      <div
        id="header-drawer"
        className={`header-drawer ${menuOpen ? "header-drawer-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="header-drawer-backdrop" onClick={() => setMenuOpen(false)} />
        <div className="header-drawer-panel">
          <nav className="header-drawer-nav" aria-label="Mobile menu">
            <Link href="/archive" onClick={() => setMenuOpen(false)}>
              Archive
            </Link>
            <Link href="/about" onClick={() => setMenuOpen(false)}>
              About
            </Link>
            <ContactCopyLink onClick={() => setMenuOpen(false)} />
            <SubmissionsCopyLink onClick={() => setMenuOpen(false)} />
            <AdvertiseCopyLink onClick={() => setMenuOpen(false)} />
            <Link href="/terms" onClick={() => setMenuOpen(false)}>
              Terms
            </Link>
            <Link href="/privacy" onClick={() => setMenuOpen(false)}>
              Privacy
            </Link>
          </nav>
          {!isSubscribed ? (
            <div className="header-drawer-bottom">
              <a
                className="button button-primary header-drawer-primary-cta"
                href="/#subscribe"
                onClick={() => setMenuOpen(false)}
              >
                Subscribe
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
