"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSubscriber } from "@/context/SubscriberContext";
import BrandWordmark from "@/components/BrandWordmark";
import { useNavLogoFillImage } from "@/context/NavLogoImageContext";
import { ContactCopyLink } from "@publication-websites/web-shell/contact-copy";
import SubmissionsCopyLink from "@/components/SubmissionsCopyLink";
import AdvertiseCopyLink from "@/components/AdvertiseCopyLink";
import { contactEmail, siteDisplayName } from "@/config/site";

/**
 * One header style everywhere: the wordmark is the brand — no separate
 * "marketing" logomark treatment.
 *
 * Scroll behavior: tracks offscreen with the page from the top (no sticky
 * slide), then reappears fixed when you scroll up.
 */
export default function Header() {
  const pathname = usePathname() || "";
  const logomarkFillImage = useNavLogoFillImage(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const [slotHeight, setSlotHeight] = useState(0);
  const [headerShift, setHeaderShift] = useState(0);
  const [scrollAnimate, setScrollAnimate] = useState(false);
  const { isSubscribed } = useSubscriber();

  const headerRef = useRef(null);
  const revealedRef = useRef(false);
  const lastYRef = useRef(0);
  const heightRef = useRef(0);

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

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const measure = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      heightRef.current = h;
      setSlotHeight(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const openMenu = () => {
    revealedRef.current = true;
    setScrollAnimate(false);
    setHeaderShift(0);
    setMenuOpen(true);
  };

  const toggleMenu = () => {
    if (menuOpen) closeMenu();
    else openMenu();
  };

  useEffect(() => {
    const scrollDelta = 6;
    lastYRef.current = window.scrollY;
    let ticking = false;

    const applyScroll = () => {
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      const h = heightRef.current || slotHeight || 1;
      const reduceMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (menuOpen) {
        setScrollAnimate(false);
        setHeaderShift(0);
        revealedRef.current = true;
      } else if (y <= 1) {
        setScrollAnimate(false);
        setHeaderShift(0);
        revealedRef.current = false;
      } else if (delta < -scrollDelta && y > h) {
        setScrollAnimate(!reduceMotion);
        setHeaderShift(0);
        revealedRef.current = true;
      } else if (delta > scrollDelta && revealedRef.current) {
        setScrollAnimate(!reduceMotion);
        setHeaderShift(-h);
        revealedRef.current = false;
      } else if (!revealedRef.current) {
        setScrollAnimate(false);
        setHeaderShift(-Math.min(y, h));
      }

      lastYRef.current = y;
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(applyScroll);
    };

    applyScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen, slotHeight]);

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
            Archive
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
      <div
        className="site-header-slot"
        style={slotHeight ? { height: slotHeight } : undefined}
        aria-hidden
      />
      <header
        ref={headerRef}
        className={`site-header site-header--article${menuOpen ? " site-header--menu-open" : ""}${scrollAnimate ? " site-header--scroll-animate" : ""}`}
        style={{
          transform: `translateY(${headerShift}px)`,
          pointerEvents:
            !menuOpen && headerShift <= -(slotHeight || 1) + 1 ? "none" : undefined,
        }}
      >
        <div className="header-row-1 container">
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
              onClick={closeMenu}
              aria-label={siteDisplayName}
            >
              <BrandWordmark
                className="brand-logo-img brand-logo-wordmark"
                fillImageUrl={logomarkFillImage}
              />
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
