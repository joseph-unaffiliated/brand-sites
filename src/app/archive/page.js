import styles from "./page.module.css";

const sampleIssues = [
  {
    title: "The Hustle-Friendly Hookup List",
    date: "Jan 8, 2026",
    summary: "Doers, operators, and connectors worth knowing this month.",
  },
  {
    title: "The Tastemakers Issue",
    date: "Dec 18, 2025",
    summary: "Editors, hosts, and curators shaping culture right now.",
  },
  {
    title: "LA Power List",
    date: "Dec 2, 2025",
    summary: "Where to go, who to meet, and what’s quietly taking off in LA.",
  },
];

export default function ArchivePage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Archive</p>
            <h1>Past issues</h1>
            <p>
              Browse the full library of Hookup Lists issues. Each entry includes
              a summary, themes, and links.
            </p>
          </div>
          <div className={styles.filters}>
            <button className={styles.filterChip}>All</button>
            <button className={styles.filterChip}>Business</button>
            <button className={styles.filterChip}>Culture</button>
            <button className={styles.filterChip}>Local</button>
          </div>
        </header>

        <div className={styles.issueList}>
          {sampleIssues.map((issue) => (
            <article className={styles.issueCard} key={issue.title}>
              <div>
                <p className={styles.issueDate}>{issue.date}</p>
                <h3>{issue.title}</h3>
                <p>{issue.summary}</p>
              </div>
              <a className={styles.readLink} href="/archive">
                Read issue →
              </a>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
