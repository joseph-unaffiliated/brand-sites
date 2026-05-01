"use client";

import Link from "next/link";
import { copyEmailToClipboard, notifyEmailCopiedToClipboard } from "@publication-websites/web-shell/contact-copy";

const SUBMISSIONS_EMAIL = "submissions@the90sparent.com";

export default function SubmissionsCopyLink({ children = "Submissions", onClick, ...props }) {
  const handleClick = async (event) => {
    event.preventDefault();
    onClick?.(event);
    await copyEmailToClipboard(SUBMISSIONS_EMAIL);
    notifyEmailCopiedToClipboard(SUBMISSIONS_EMAIL);
  };

  return (
    <Link href={`mailto:${SUBMISSIONS_EMAIL}`} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
