import { Suspense } from "react";
import { getArticles, ensureDescriptionOnly, searchTextFromArticle } from "@/lib/articles";
import ArchiveBrowser from "@/components/ArchiveBrowser";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import { siteDisplayName } from "@/config/site";
import styles from "./page.module.css";

const title = `From the Vault | ${siteDisplayName}`;
const description =
  "Every From the Vault issue: classic Heeb stories dug out of the archive, with fresh commentary. Browse and search, newest first.";

export const metadata = {
  title,
  description,
  alternates: { canonical: "/from-the-vault" },
  openGraph: {
    title,
    description,
    url: "/from-the-vault",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function FromTheVaultPage() {
  const articles = await getArticles();
  const issues = articles.map((article) => ({
    _id: article._id,
    slug: article.slug,
    title: article.title,
    summary: ensureDescriptionOnly(article.summary) || null,
    mainImage: article.mainImage,
    publishedDate: article.publishedDate,
    searchText: searchTextFromArticle(article),
  }));

  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>From the Vault</p>
            <h1>Past issues</h1>
          </div>
        </header>

        <Suspense fallback={null}>
          <ArchiveBrowser issues={issues} />
        </Suspense>

        <HideWhenSubscribed>
          <p className={styles.emptyState}>
            New issues drop weekly.{" "}
            <a href="/#subscribe">Subscribe to get them in your inbox.</a>
          </p>
        </HideWhenSubscribed>
      </div>
    </div>
  );
}
