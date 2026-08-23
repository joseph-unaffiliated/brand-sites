"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { BRAND } from "@/lib/subscription";
import { useSubscriber } from "@/context/SubscriberContext";
import { callGiveawayApi } from "@/lib/giveaway-api";
import actions from "@/components/SubscriptionPageActions.module.css";
import styles from "../subscribed/page.module.css";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useSubscriber();
  const [status, setStatus] = useState("working");
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing sign-in link. Request a new one from Subscribe / Sign in.");
      return;
    }

    let cancelled = false;
    callGiveawayApi({ action: "redeem", token })
      .then((data) => {
        if (cancelled) return;
        if (data.email) {
          localStorage.setItem(`subscribed_${BRAND}`, "true");
          localStorage.setItem(`email_${BRAND}`, data.email);
          if (!localStorage.getItem(`subscribed_at_${BRAND}`)) {
            localStorage.setItem(`subscribed_at_${BRAND}`, new Date().toISOString());
          }
          refresh();
        }
        setStatus("success");
        setMessage("You’re signed in.");
        const returnPath =
          typeof data.returnPath === "string" && data.returnPath.startsWith("/")
            ? data.returnPath
            : "/profile";
        window.setTimeout(() => router.replace(returnPath), 800);
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setMessage("This sign-in link is invalid or expired.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, refresh, router]);

  return (
    <div className={styles.wrap} data-subscription-landing>
      <div className={`${styles.card} ${actions.cardWide}`}>
        <h1 className={styles.heading}>
          {status === "working" && <>Signing you in…</>}
          {status === "success" && <>You’re signed in.</>}
          {status === "error" && <>Sign-in failed</>}
        </h1>
        <p className={styles.body}>{message}</p>
        {status === "error" && (
          <div className={actions.actionRow}>
            <Link className={actions.btn} href="/#subscribe">
              Subscribe / Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
