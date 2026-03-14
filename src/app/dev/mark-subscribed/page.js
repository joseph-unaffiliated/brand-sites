"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const BRAND = "hookuplists";

export default function DevMarkSubscribedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (!isLocal) {
      router.replace("/");
      return;
    }
    const email =
      searchParams.get("email")?.trim() || "dev@test.com";
    const encoded = encodeURIComponent(email);
    const now = new Date().toISOString();
    localStorage.setItem(`subscribed_${BRAND}`, "true");
    localStorage.setItem(`email_${BRAND}`, encoded);
    localStorage.setItem(`subscribed_at_${BRAND}`, now);
    router.replace("/");
  }, [router, searchParams]);

  return (
    <p style={{ padding: 24, fontFamily: "system-ui" }}>
      Marking you as subscribed and redirecting…
    </p>
  );
}
