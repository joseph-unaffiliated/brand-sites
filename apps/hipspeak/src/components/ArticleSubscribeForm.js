"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SubscribeFormWithTurnstile from "./SubscribeFormWithTurnstile";

function decodeEmailParam(value) {
  if (value == null || value === "") return undefined;
  try {
    return decodeURIComponent(String(value));
  } catch {
    return String(value);
  }
}

function ArticleSubscribeDisclaimer() {
  return (
    <p className="article-disclaimer">
      By entering your email you are agreeing to our{" "}
      <Link href="/terms">Terms of Use</Link> and{" "}
      <Link href="/privacy">Privacy Policy</Link>.
    </p>
  );
}

/** Reads ?email= on the client so the article page can stay compatible with generateStaticParams. */
function ArticleSubscribeFormInner() {
  const searchParams = useSearchParams();
  const initialEmail = decodeEmailParam(searchParams.get("email"));
  return (
    <>
      <SubscribeFormWithTurnstile initialEmail={initialEmail} layout="article" />
      <ArticleSubscribeDisclaimer />
    </>
  );
}

export default function ArticleSubscribeForm() {
  return (
    <Suspense
      fallback={
        <>
          <SubscribeFormWithTurnstile initialEmail={undefined} layout="article" />
          <ArticleSubscribeDisclaimer />
        </>
      }
    >
      <ArticleSubscribeFormInner />
    </Suspense>
  );
}
