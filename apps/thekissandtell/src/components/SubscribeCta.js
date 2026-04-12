"use client";

import Link from "next/link";
import { useSubscriber } from "@/context/SubscriberContext";

export default function SubscribeCta() {
  const { isSubscribed } = useSubscriber();
  if (isSubscribed) {
    return (
      <p>
        You can read past issues in our <Link href="/archive">archive</Link>.
        Manage your subscription in your <Link href="/profile">profile</Link>.
      </p>
    );
  }
  return (
    <p>
      You can read past issues in our <Link href="/archive">archive</Link>.
      To get new ones in your inbox, <Link href="/#subscribe">subscribe
      here</Link>. No spam, just the list. You can unsubscribe anytime.
    </p>
  );
}
