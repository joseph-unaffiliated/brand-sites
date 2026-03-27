"use client";

import Link from "next/link";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

export default function ArticleSubscribeForm({ initialEmail }) {
  return (
    <>
      <SubscribeFormWithTurnstile initialEmail={initialEmail} layout="article" />
      <p className="article-disclaimer">
        By entering your email you are agreeing to our{" "}
        <Link href="/terms">Terms of Use</Link> and{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </>
  );
}
