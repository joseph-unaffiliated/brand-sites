import Link from "next/link";
import SubscribeCta from "@/components/SubscribeCta";
import styles from "../basic-page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1>About The Pickle Report</h1>
        <p>
          The Pickle Report is a weekly email series about pickle culture,
          history, trends, and the weirdly wonderful stories that orbit the
          humble pickle.
        </p>

        <h2>How it works</h2>
        <p>
          Every week, we deliver one issue with a curated mix of reporting,
          commentary, and pickle-adjacent internet finds. You subscribe once,
          and each new issue lands in your inbox for free.
        </p>

        <h2>Why we made it</h2>
        <p>
          The Pickle Report is for anyone who cares about food culture, curious
          subcultures, and stories that are equal parts specific and delightful.
        </p>

        <h2>Explore and subscribe</h2>
        <SubscribeCta />

        <p>
          Questions? Reach us at{" "}
          <a href="mailto:contact@thepicklereport.com">contact@thepicklereport.com</a>.
        </p>
      </div>
    </div>
  );
}
