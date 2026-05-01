"use client";

import { useSubscriber } from "@/context/SubscriberContext";
import ArticleAdStickyBottom from "./ArticleAdStickyBottom";
import ArticleSubscribeStickyBottom from "./ArticleSubscribeStickyBottom";

/** Article foot: sticky subscribe CTA when not subscribed; sticky ad when subscribed. */
export default function ArticleStickyBottom() {
  const { isSubscribed } = useSubscriber();
  if (isSubscribed) return <ArticleAdStickyBottom />;
  return <ArticleSubscribeStickyBottom />;
}
