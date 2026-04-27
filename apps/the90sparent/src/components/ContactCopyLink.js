"use client";

import Link from "next/link";
import { copyEmailToClipboard, notifyEmailCopiedToClipboard } from "@/lib/copy-email-clipboard";

const CONTACT_EMAIL = "contact@the90sparent.com";

export default function ContactCopyLink({ children = "Contact", onClick, ...props }) {
  const handleClick = async (event) => {
    event.preventDefault();
    onClick?.(event);
    await copyEmailToClipboard(CONTACT_EMAIL);
    notifyEmailCopiedToClipboard(CONTACT_EMAIL);
  };

  return (
    <Link href="/contact" onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
