"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSubscriber } from "@/context/SubscriberContext";
import BrandLogoMarkLarge from "@/components/BrandLogoMarkLarge";
import BrandWordmark from "@/components/BrandWordmark";
import { useNavLogoFillImage } from "@/context/NavLogoImageContext";
import { ContactCopyLink } from "@publication-websites/web-shell/contact-copy";
import SubmissionsCopyLink from "@/components/SubmissionsCopyLink";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
import { contactEmail, siteDisplayName } from "@/config/site";

export default function Header() {
  const pathname = usePathname() || "";
  const isArticle = pathname.startsWith("/word/");
  const isMarketing = !isArticle;
  const logomarkFillImage = useNavLogoFillImage(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const { isSubscribed } = useSubscriber();

  useEffect(() => {
    setDrawerMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const openMenu = () => {
    setHeaderHidden(false);
    setMenuOpen(true);
  };

  const toggleMenu = () => {
    if (menuOpen) closeMenu();
    else openMenu();
  };

  useEffect(() => {
    if (!isArticle) {
      setHeaderHidden(false);
      return;
    }

    const topOffset = 64;
    const scrollDelta = 6;
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;

        if (menuOpen) {
          setHeaderHidden(false);
        } else if (y <= topOffset) {
          setHeaderHidden(false);
        } else if (delta > scrollDelta) {
          setHeaderHidden(true);
        } else if (delta < -scrollDelta) {
          setHeaderHidden(false);
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isArticle, menuOpen]);

  const subscribeDesktop = (
    <a className="button button-secondary" href="/#subscribe">
      Subscribe
    </a>
  );

  const subscribeMobile = (
    <a
      className="button button-secondary header-subscribe-mobile"
      href="/#subscribe"
      onClick={closeMenu}
    >
      Subscribe
    </a>
  );

  const mobileDrawer = (
    <div
      id="header-drawer"
      className={`header-drawer ${menuOpen ? "header-drawer-open" : ""}`}
      aria-hidden={!menuOpen}
    >
      <div className="header-drawer-backdrop" onClick={closeMenu} aria-hidden />
      <div className="header-drawer-panel">
        <nav className="header-drawer-nav" aria-label="Mobile menu">
          <Link href="/archive" onClick={closeMenu}>
            Words
          </Link>
          <Link href="/my-words" onClick={closeMenu}>
            My words
          </Link>
          <Link href="/about" onClick={closeMenu}>
            About
          </Link>
          <ContactCopyLink email={contactEmail} onClick={closeMenu}>
            Contact
          </ContactCopyLink>
          <SubmissionsCopyLink onClick={closeMenu} />
          <AdvertiseCopyLink onClick={closeMenu} />
          <Link href="/terms" onClick={closeMenu}>
            Terms
          </Link>
          <Link href="/privacy" onClick={closeMenu}>
            Privacy
          </Link>
        </nav>
        {!isSubscribed ? (
          <div className="header-drawer-bottom">
            <a
              className="button button-primary header-drawer-primary-cta"
              href="/#subscribe"
              onClick={closeMenu}
            >
              Subscribe
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
    <header
      className={`site-header ${isArticle ? "site-header--article" : "site-header--marketing"}${menuOpen ? " site-header--menu-open" : ""}${isArticle && headerHidden && !menuOpen ? " site-header--scroll-hidden" : ""}`}
    >
      <div
        className={`header-row-1 ${isArticle ? "container" : `container-wide header-row-marketing${isSubscribed ? " header-row-marketing--subscribed" : ""}`}`}
      >
        <button
          type="button"
          className="header-hamburger"
          aria-expanded={menuOpen}
          aria-controls="header-drawer"
          aria-label="Toggle menu"
          onClick={toggleMenu}
        >
          <span className="header-hamburger-line" aria-hidden />
        </button>
        <nav className="site-nav site-nav-left header-nav-desktop" aria-label="Main">
          <Link href="/archive">Words</Link>
          <Link href="/my-words">My words</Link>
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
            onClick={closeMenu}
            aria-label={siteDisplayName}
          >
            {isArticle ? (
              <BrandWordmark
                className="brand-logo-img brand-logo-wordmark"
                fillImageUrl={logomarkFillImage}
              />
            ) : (
              <BrandLogoMarkLarge
                className="brand-logo-img brand-logo-mark brand-logo-mark-large"
                fillImageUrl={logomarkFillImage}
              />
            )}
          </Link>
        </div>
        <nav className="site-nav site-nav-right header-nav-desktop" aria-label="Main">
          {isSubscribed ? (
            <Link href="/about">About</Link>
          ) : (
            <>
              <ContactCopyLink email={contactEmail}>Contact</ContactCopyLink>
              {subscribeDesktop}
            </>
          )}
        </nav>
        {!isSubscribed ? subscribeMobile : null}
      </div>
    </header>
    {drawerMounted ? createPortal(mobileDrawer, document.body) : null}
    </>
  );
}
