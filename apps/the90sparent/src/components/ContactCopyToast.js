"use client";

import { useEffect, useRef, useState } from "react";

const TOAST_MESSAGE = '"contact@the90sparent.com" has been copied to your clipboard';

export default function ContactCopyToast() {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const showToast = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setVisible(true);
      timeoutRef.current = window.setTimeout(() => setVisible(false), 2600);
    };

    window.addEventListener("contact-email-copied", showToast);
    return () => {
      window.removeEventListener("contact-email-copied", showToast);
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
      {TOAST_MESSAGE}
    </div>
  );
}
