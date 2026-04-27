"use client";

import Link from "next/link";
import { copyEmailToClipboard, notifyEmailCopiedToClipboard } from "@/lib/copy-email-clipboard";

const ADVERTISE_EMAIL = "advertise@the90sparent.com";

export default function AdvertiseCopyLink({ children = "Advertise with Us", onClick, ...props }) {
  const handleClick = async (event) => {
    event.preventDefault();
    onClick?.(event);
    await copyEmailToClipboard(ADVERTISE_EMAIL);
    notifyEmailCopiedToClipboard(ADVERTISE_EMAIL);
  };

  return (
    <Link href={`mailto:${ADVERTISE_EMAIL}`} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
