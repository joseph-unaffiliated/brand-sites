"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSubscriber } from "@/context/SubscriberContext";

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

  const ctaDesktop = isSubscribed ? (
    <Link href="/profile" className="button button-secondary header-profile-link" aria-label="Profile">
      <i className="fa-solid fa-user-circle" aria-hidden />
    </Link>
  ) : (
    <a className="button button-secondary" href="/#subscribe">
      Subscribe / Log in
    </a>
  );

  const ctaMobile = isSubscribed ? (
    <Link
      href="/profile"
      className="button button-secondary header-subscribe-mobile header-profile-link"
      onClick={() => setMenuOpen(false)}
      aria-label="Profile"
    >
      <i className="fa-solid fa-user-circle" aria-hidden />
    </Link>
  ) : (
    <a
      className="button button-secondary header-subscribe-mobile"
      href="/#subscribe"
      onClick={() => setMenuOpen(false)}
    >
      Subscribe / Log in
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
          <span className="header-hamburger-line" />
          <span className="header-hamburger-line" />
          <span className="header-hamburger-line" />
        </button>
        <nav className="site-nav site-nav-left header-nav-desktop" aria-label="Main">
          <Link href="/archive">Archive</Link>
          <Link href="/about">About</Link>
        </nav>
        <div className="brand">
          <Link href="/" className="brand-name" onClick={() => setMenuOpen(false)}>
            <Image
              src="/hl-logo-black.png"
              alt=""
              width={88}
              height={88}
              priority
              className="brand-logo-img"
            />
          </Link>
        </div>
        <nav className="site-nav site-nav-right header-nav-desktop" aria-label="Main">
          <Link href="/contact">Contact</Link>
          {ctaDesktop}
        </nav>
        {ctaMobile}
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
            <Link href="/contact" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
