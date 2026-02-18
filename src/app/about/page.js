import styles from "../basic-page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1>About Hookup Lists</h1>
        <p>
          Hookup Lists is an editorial email series that connects you with the
          right people, opportunities, and cultural signals. Every issue is
          curated with intention, context, and a point of view.
        </p>
        <p>
          The newsletter is part of a growing network of lists that share a
          universal profile, so your preferences travel with you as new brands
          launch.
        </p>
      </div>
    </div>
  );
}
