"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import SubscribeBlock from "./SubscribeBlock";
import { useSubscriber } from "@/context/SubscriberContext";
import styles from "./SubscribePopup.module.css";

export default function SubscribePopup() {
  const [open, setOpen] = useState(false);
  const { isSubscribed } = useSubscriber();
  const searchParams = useSearchParams();
  const close = useCallback(() => setOpen(false), []);
  const initialEmail = searchParams.get("email") ? decodeURIComponent(searchParams.get("email")) : undefined;

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (isSubscribed) return;
    function handleClick(e) {
      const link = e.target.closest('a[href*="#subscribe"]');
      if (link) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isSubscribed]);

  useEffect(() => {
    if (typeof window === "undefined" || isSubscribed) return;
    if (window.location.hash === "#subscribe") {
      setOpen(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [isSubscribed]);

  useEffect(() => {
    function handleKeydown(e) {
      if (e.key === "Escape") close();
    }
    if (open) {
      document.addEventListener("keydown", handleKeydown);
      return () => document.removeEventListener("keydown", handleKeydown);
    }
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
      aria-hidden={!open}
    >
      <div className={styles.backdrop} onClick={close} aria-hidden="true" />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscribe-popup-title"
        onClick={close}
      >
        <div className={styles.panelInner}>
          <div className={styles.moduleWrap} onClick={(e) => e.stopPropagation()}>
            <SubscribeBlock layout="banner" initialEmail={initialEmail} />
          </div>
        </div>
      </div>
    </div>
  );
}
