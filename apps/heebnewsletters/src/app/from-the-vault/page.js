import { Suspense } from "react";
import { getArticles, ensureDescriptionOnly, searchTextFromArticle } from "@/lib/articles";
import ArchiveBrowser from "@/components/ArchiveBrowser";
import { siteDisplayName } from "@/config/site";
import styles from "./page.module.css";

const title = `The Vault | ${siteDisplayName}`;
const description =
  "Every From the Vault issue: classic Heeb stories dug out of the archive, with fresh commentary. Browse and search by original publication date.";

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
    mainImageWidth: article.mainImageWidth,
    mainImageHeight: article.mainImageHeight,
    originalYear: article.originalYear,
    originalPublication: article.originalPublication,
    searchText: searchTextFromArticle(article),
  }));

  return (
    <div className={styles.page}>
      <div className="container">
        <header className="page-header">
          <h1>The Vault</h1>
        </header>

        <Suspense fallback={null}>
          <ArchiveBrowser issues={issues} />
        </Suspense>
      </div>
    </div>
  );
}
