"use client";

import { useSubscriber } from "@/context/SubscriberContext";

export default function HideWhenSubscribed({ children }) {
  const { isSubscribed } = useSubscriber();
  if (isSubscribed) return null;
  return children;
}
