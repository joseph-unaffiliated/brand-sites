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
          {siteDisplayName} is a weekly newsletter for parents who remember renting VHS tapes and now negotiate
          screen time like it is a UN treaty. We publish one readable issue at a time—no infinite feed, no guilt
          spiral.
        </p>
        <p>
          Expect funny stories, blunt truths, and the occasional deep cut reference only millennials will catch.
          You subscribe once, and new issues arrive in your inbox.
        </p>
        <p>
          Whether you have toddlers, tweens, or teens, if you have ever said &quot;because I said so&quot; and
          immediately heard your own parent in your head, you are in the right place.
        </p>
        <p className={styles.note}>
          Email:{" "}
          <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
        </p>
      </article>
    </div>
  );
}
