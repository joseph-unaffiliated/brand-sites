"use client";

import { useEffect, useRef, useState } from "react";
import "./contact-copy-toast.css";

export default function ContactCopyToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const timeoutRef = useRef(null);

  useEffect(() => {
    const showToast = (event) => {
      const email = event?.detail?.email;
      if (!email || typeof email !== "string") return;
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      setMessage(`"${email}" has been copied to your clipboard`);
      setVisible(true);
      timeoutRef.current = window.setTimeout(() => setVisible(false), 2600);
    };

    window.addEventListener("clipboard-email-copied", showToast);
    return () => {
      window.removeEventListener("clipboard-email-copied", showToast);
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
