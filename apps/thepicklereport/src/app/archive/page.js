import { Suspense } from "react";
import { getArticles } from "@/lib/articles";
import ArchiveBrowser from "@/components/ArchiveBrowser";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import HomeSubscribeSection from "@/components/HomeSubscribeSection";
import { siteDisplayName } from "@/config/site";
import styles from "./page.module.css";

export const metadata = {
  title: `Archive | ${siteDisplayName}`,
  description: `Browse the full library of issues from ${siteDisplayName}. Filter by theme, or search.`,
  alternates: { canonical: "/archive" },
  openGraph: {
    title: `Archive | ${siteDisplayName}`,
    description: `Browse the full library of issues from ${siteDisplayName}. Filter by theme, or search.`,
    url: "/archive",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Archive | ${siteDisplayName}`,
    description: `Browse the full library of issues from ${siteDisplayName}. Filter by theme, or search.`,
  },
};

export default async function ArchivePage({ searchParams: searchParamsProp }) {
  const searchParams =
    typeof searchParamsProp?.then === "function"
      ? await searchParamsProp
      : searchParamsProp ?? {};
  const initialEmail = searchParams?.email
    ? decodeURIComponent(String(searchParams.email))
    : undefined;

  const articles = await getArticles();

  return (
    <>
      <div className={styles.page}>
        <div className="container">
          <header className={styles.header}>
            <div>
              <p className={styles.kicker}>Archive</p>
              <h1>Past issues</h1>
              <p>Browse the full library of articles</p>
            </div>
          </header>

          <Suspense fallback={null}>
            <ArchiveBrowser articles={articles} />
          </Suspense>

          <HideWhenSubscribed>
            <p className={styles.emptyState}>
              New issues drop weekly.{" "}
              <a href="/#subscribe">Subscribe to get them in your inbox.</a>
            </p>
          </HideWhenSubscribed>
        </div>
      </div>
      <HomeSubscribeSection
        initialEmail={initialEmail}
        inputId="archive-subscribe-cta-email"
        titleId="archive-subscribe-cta-title"
      />
    </>
  );
}
