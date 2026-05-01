"use client";

import { useCallback, useEffect, useState } from "react";
import ArticleSubscribeForm from "./ArticleSubscribeForm";
import { siteDisplayName } from "@/config/site";

export default function ArticleSubscribeStickyBottom() {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleClose = useCallback(() => setCollapsed(true), []);

  if (!mounted || collapsed) return null;

  return (
    <div className="article-ad-sticky-bottom article-ad-sticky-bottom--subscribe">
      <div className="article-ad-sticky-bottom-inner">
        <div className="article-ad-sticky-bottom-slot article-ad-sticky-subscribe-slot">
          <div className="articlebody-section article-sticky-subscribe-inner">
            <section className="newslettercta-section">
              <div className="newslettercta-block">
                <div className="newslettercta-prompt">
                  <span>Subscribe for new issues of </span>
                  <span>{siteDisplayName}</span>
                  <span className="italic">, weekly in your inbox</span>
                </div>
                <ArticleSubscribeForm />
              </div>
            </section>
          </div>
          <button
            type="button"
            className="article-ad-sticky-dismiss"
            onClick={handleClose}
            aria-label="Close subscription banner"
          >
            <svg
              className="article-ad-sticky-dismiss-icon"
              viewBox="0 0 12 12"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
