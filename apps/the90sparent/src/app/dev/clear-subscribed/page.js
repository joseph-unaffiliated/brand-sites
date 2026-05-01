"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";

const BRAND = siteConfig.brandId;

function DevClearSubscribedInner() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocal) {
      router.replace("/");
      return;
    }
    localStorage.removeItem(`subscribed_${BRAND}`);
    localStorage.removeItem(`email_${BRAND}`);
    localStorage.removeItem(`subscribed_at_${BRAND}`);
    localStorage.removeItem("magic_reader_token");
    router.replace("/");
  }, [router]);

  return (
    <p style={{ padding: 24, fontFamily: "system-ui" }}>
      Clearing subscriber local state and redirecting…
    </p>
  );
}

export default function DevClearSubscribedPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24, fontFamily: "system-ui" }}>Loading…</p>}>
      <DevClearSubscribedInner />
    </Suspense>
  );
}
