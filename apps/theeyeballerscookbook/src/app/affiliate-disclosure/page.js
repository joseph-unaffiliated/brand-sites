import Link from "next/link";
import styles from "../basic-page.module.css";
import { contactEmail, siteDisplayName } from "@/config/site";
import { affiliateDisclosureMeta } from "@publication-websites/affiliate/disclosure";

const copy = affiliateDisclosureMeta({ siteDisplayName });

export const metadata = {
  title: copy.title,
  description: copy.description,
  alternates: { canonical: "/affiliate-disclosure" },
  openGraph: copy.openGraph,
  twitter: copy.twitter,
};

export default function AffiliateDisclosurePage() {
  const s = copy.sections;
  return (
    <div className={`${styles.page} ${styles.pageLegal}`}>
      <div className="container">
        <header className={styles.legalHeader}>
          <h1>Affiliate Disclosure</h1>
          <p className={styles.legalMeta}>
            How {siteDisplayName} uses affiliate links
          </p>
        </header>

        <p>{s.intro}</p>

        <h2>{s.amazonHeading}</h2>
        <p>{s.amazonBody}</p>
        <p>
          <em>{copy.amazonShortNotice}</em>
        </p>

        <h2>{s.otherHeading}</h2>
        <p>{s.otherBody}</p>

        <h2>{s.editorialHeading}</h2>
        <p>{s.editorialBody}</p>

        <h2>{s.contactHeading}</h2>
        <p>
          Questions about this disclosure?{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          {" "}or see our{" "}
          <Link href="/terms">Terms</Link> and{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
