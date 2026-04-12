import styles from "../basic-page.module.css";
import { contactEmail, siteDisplayName } from "@/config/site";

export const metadata = {
  title: `Contact | ${siteDisplayName}`,
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
