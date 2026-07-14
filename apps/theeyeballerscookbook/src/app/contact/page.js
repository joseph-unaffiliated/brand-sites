import styles from "../basic-page.module.css";
import { contactEmail, siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Contact | ${siteDisplayName}`,
  description: `Reach out to ${siteDisplayName} with questions, feedback, or collaboration ideas.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `Contact | ${siteDisplayName}`,
    description: `Reach out to ${siteDisplayName} with questions, feedback, or collaboration ideas.`,
    url: "/contact",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Contact | ${siteDisplayName}`,
    description: `Reach out to ${siteDisplayName} with questions, feedback, or collaboration ideas.`,
  },
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1>Contact</h1>
        <p>
          Have a question, suggestion, or collaboration idea? Reach out and we
          will get back to you.
        </p>
        <p className={styles.note}>
          Email: <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </div>
    </div>
  );
}
