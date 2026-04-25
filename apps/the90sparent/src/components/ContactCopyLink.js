"use client";

import Link from "next/link";

const CONTACT_EMAIL = "contact@the90sparent.com";

async function copyContactEmail() {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    return true;
  } catch {
    const fallbackInput = document.createElement("textarea");
    fallbackInput.value = CONTACT_EMAIL;
    fallbackInput.setAttribute("readonly", "");
    fallbackInput.style.position = "fixed";
    fallbackInput.style.opacity = "0";
    fallbackInput.style.pointerEvents = "none";
    document.body.appendChild(fallbackInput);
    fallbackInput.focus();
    fallbackInput.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    document.body.removeChild(fallbackInput);
    return copied;
  }
}

export default function ContactCopyLink({ children = "Contact", onClick, ...props }) {
  const handleClick = async (event) => {
    event.preventDefault();
    onClick?.(event);
    await copyContactEmail();
    window.dispatchEvent(new CustomEvent("contact-email-copied"));
  };

  return (
    <Link href="/contact" onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
