"use client";

import Link from "next/link";
import { useSubscriber } from "@/context/SubscriberContext";

export default function SubscribeCta() {
  const { isSubscribed } = useSubscriber();
  if (isSubscribed) {
    return (
      <p>
        You can read past articles in our <Link href="/from-the-vault">archive</Link>. New
        articles arrive in your inbox.
      </p>
    );
  }
  return (
    <p>
      You can read past articles in our <Link href="/from-the-vault">archive</Link>.
      To get new articles in your inbox, <Link href="/#subscribe">subscribe
      here</Link>. No spam, just the list. You can unsubscribe anytime.
    </p>
  );
}
