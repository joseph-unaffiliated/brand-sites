"use client";

import { useEffect, useRef, useState } from "react";
import "./contact-copy-toast.css";

export default function ContactCopyToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    const present = (text, durationMs) => {
      if (!text || typeof text !== "string") return;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setMessage(text);
      setVisible(true);
      timeoutRef.current = window.setTimeout(() => setVisible(false), durationMs);
    };

    const onCopied = (event) => {
      const email = event?.detail?.email;
      if (!email || typeof email !== "string") return;
      present(`"${email}" has been copied to your clipboard`, 2600);
    };

    const onSiteToast = (event) => {
      const text = event?.detail?.message;
      const durationMs = Number(event?.detail?.durationMs) || 4000;
      present(text, durationMs);
    };

    window.addEventListener("clipboard-email-copied", onCopied);
    window.addEventListener("site-toast", onSiteToast);
    return () => {
      window.removeEventListener("clipboard-email-copied", onCopied);
      window.removeEventListener("site-toast", onSiteToast);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      className={`contact-copy-toast ${visible ? "contact-copy-toast-visible" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {message}
    </div>
  );
}
