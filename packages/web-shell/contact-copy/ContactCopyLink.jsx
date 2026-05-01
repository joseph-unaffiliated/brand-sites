"use client";

import Link from "next/link";
import { copyEmailToClipboard, notifyEmailCopiedToClipboard } from "./copy-email-clipboard.js";

export default function ContactCopyLink({
  email,
  href = "/contact",
  children = "Contact",
  onClick,
  ...props
}) {
  const handleClick = async (event) => {
    event.preventDefault();
    onClick?.(event);
    if (!email) return;
    await copyEmailToClipboard(email);
    notifyEmailCopiedToClipboard(email);
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
