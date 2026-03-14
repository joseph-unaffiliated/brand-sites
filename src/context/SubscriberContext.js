"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { BRAND } from "@/lib/subscription";

function getStoredState() {
  if (typeof window === "undefined") {
    return { isSubscribed: false, email: null, subscribedAt: null };
  }
  const isSubscribed = localStorage.getItem(`subscribed_${BRAND}`) === "true";
  const email = localStorage.getItem(`email_${BRAND}`);
  const subscribedAt = localStorage.getItem(`subscribed_at_${BRAND}`);
  return {
    isSubscribed,
    email: email ? decodeURIComponent(email) : null,
    subscribedAt: subscribedAt || null,
  };
}

const SubscriberContext = createContext(null);

export function SubscriberProvider({ children }) {
  const [state, setState] = useState({ isSubscribed: false, email: null, subscribedAt: null });

  useEffect(() => {
    setState(getStoredState());
    const handleStorage = () => setState(getStoredState());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      refresh: () => setState(getStoredState()),
    }),
    [state.isSubscribed, state.email, state.subscribedAt]
  );

  return (
    <SubscriberContext.Provider value={value}>{children}</SubscriberContext.Provider>
  );
}

export function useSubscriber() {
  const ctx = useContext(SubscriberContext);
  if (!ctx) {
    return {
      isSubscribed: false,
      email: null,
      subscribedAt: null,
      refresh: () => {},
    };
  }
  return ctx;
}
