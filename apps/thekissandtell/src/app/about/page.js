import styles from "../basic-page.module.css";
import { siteDisplayName, contactEmail } from "@/config/site";

export const metadata = {
  title: `About | ${siteDisplayName}`,
};

export default function AboutPage() {
  return (
    <div className="container">
      <article className={styles.article}>
        <h1>About {siteDisplayName}</h1>
        <p>
          {siteDisplayName} is a weekly newsletter about love, dating, and relationships—the funny,
          messy, and surprisingly tender parts. We publish one focused issue at a time so you can
          read it start to finish.
        </p>
        <p>
          Expect true stories, sharp commentary, and the occasional rant about apps, mixed signals,
          and modern romance. You subscribe once, and new issues land in your inbox—no doomscrolling
          required.
        </p>
        <p>
          {siteDisplayName} is for readers who want more nuance than a hot take and more heart than a
          listicle—whether you&apos;re single, coupled, or somewhere gloriously in between.
        </p>
        <p className={styles.note}>
          Email:{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </article>
    </div>
  );
}
