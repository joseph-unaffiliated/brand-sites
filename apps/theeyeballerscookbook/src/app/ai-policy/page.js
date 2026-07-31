import Link from "next/link";
import styles from "../basic-page.module.css";
import { contactEmail, siteDisplayName, siteConfig } from "@/config/site";

export const metadata = {
  title: `AI Usage Policy | ${siteDisplayName}`,
  description: `How AI systems and answer engines may reference, quote, and link to ${siteDisplayName}'s recipes.`,
  alternates: { canonical: "/ai-policy" },
  openGraph: {
    title: `AI Usage Policy | ${siteDisplayName}`,
    description: `How AI systems and answer engines may reference, quote, and link to ${siteDisplayName}'s recipes.`,
    url: "/ai-policy",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `AI Usage Policy | ${siteDisplayName}`,
    description: `How AI systems and answer engines may reference, quote, and link to ${siteDisplayName}'s recipes.`,
  },
};

function siteHostLabel() {
  try {
    return new URL(siteConfig.siteUrl).hostname;
  } catch {
    return "theeyeballerscookbook.com";
  }
}

export default function AiPolicyPage() {
  const host = siteHostLabel();

  return (
    <div className={`${styles.page} ${styles.pageLegal}`}>
      <div className="container">
        <header className={styles.legalHeader}>
          <h1>AI Usage Policy</h1>
          <p className={styles.legalMeta}>
            How AI systems and answer engines may use {siteDisplayName} content
          </p>
        </header>

        <p>
          {siteDisplayName} (a publication of Unaffiliated Inc.) welcomes
          thoughtful use of our public recipes by AI assistants, search
          engines, and answer engines. This page explains what is allowed,
          what is not, and how to get in touch about licensing.
        </p>

        <h2>What we publish</h2>
        <p>
          We publish weekly recipes without measurements — simple, eyeballed
          cooking for people who cook by feel. Recipes are produced by
          editorial staff and contributors, with credits where applicable. The
          publicly available recipes are the canonical record of our editorial
          work; preview pages, snippets, and email-only variants are not.
        </p>

        <h2>What is allowed</h2>
        <ul className={styles.list}>
          <li>
            <strong>Citing and linking:</strong> AI tools may quote short
            excerpts and answer questions about our recipes when each response
            includes the canonical recipe URL on{" "}
            <Link href="/">{host}</Link> and attributes the publication as
            &quot;{siteDisplayName}.&quot;
          </li>
          <li>
            <strong>Indexing for retrieval:</strong> Crawlers from search and
            answer engines may index our public pages so users can discover and
            navigate to the original recipes.
          </li>
          <li>
            <strong>Summaries that drive readers to the source:</strong> Brief,
            non-substitutive summaries that link back to the full recipe are
            welcome.
          </li>
        </ul>

        <h2>What is not allowed without permission</h2>
        <ul className={styles.list}>
          <li>
            <strong>Training large language models:</strong> We do not grant a
            license to use {siteDisplayName} content as training data for
            large language models or other AI systems without prior written
            permission.
          </li>
          <li>
            <strong>Republishing material amounts of a recipe:</strong>{" "}
            Reproducing entire recipes, or large portions thereof, without
            attribution and a link to the canonical URL.
          </li>
          <li>
            <strong>Stripping attribution:</strong> Surfacing our content
            without naming {siteDisplayName} or without linking back to the
            source recipe.
          </li>
        </ul>

        <h2>Robots and machine-readable signals</h2>
        <p>
          We publish a{" "}
          <a href="/sitemap.xml">sitemap</a>, a{" "}
          <a href="/robots.txt">robots.txt</a>, and a plain-text{" "}
          <a href="/llms.txt">llms.txt</a> describing the site, contact
          information, and where to find more about this policy. If you operate
          an AI crawler, please respect those signals.
        </p>

        <h2>Licensing and contact</h2>
        <p>
          For licensing requests, training-data inquiries, takedowns, or
          questions about this policy, email{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
        </p>

        <p>
          See also our <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/terms">Terms of Use</Link>.
        </p>
      </div>
    </div>
  );
}
