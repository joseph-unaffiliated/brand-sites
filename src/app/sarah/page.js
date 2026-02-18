import Image from "next/image";
import styles from "./page.module.css";

const entries = [
  {
    age: "Age 12",
    title: "The Sixth Grade Romantic",
    body:
      "First kiss. A Blues Brothers dance at the JCC. He gave me a Presidents of the United States of America CD for Valentine’s Day. No tongue. No sparks. But my diary entry was basically fireworks.",
  },
  {
    age: "Age 16",
    title: "The Camp Crush",
    body:
      "We were both counselors at Jewish summer camp. Lean, aloof, smelled like sunscreen and Marlboros. I was obsessed. He came out four years later, which honestly just confirmed his hotness.",
  },
  {
    age: "Age 21",
    title: "The Awkward First Time",
    body:
      "Childhood friend turned “first time”. I confessed my virginity. He said, “We should fix that.” We did. It was awkward and oddly bureaucratic.",
  },
  {
    age: "Age 22",
    title: "The Internet Cafe Find",
    body:
      "I met him at an internet cafe in Thailand. On our second night shagging, I bit his shoulder. He ghosted. My sexual experimentation phase lasted exactly one nibble.",
  },
  {
    age: "Age 26",
    title: "The Almost Forever",
    body:
      "We moved in together. He was open to converting for me. After a year and a half, we outgrew each other in slow motion. We broke up when he left for grad school and I was so relieved.",
  },
  {
    age: "Age 27",
    title: "The Clumsy Writer",
    body:
      "A journalist that spilled wine all over himself on our first date. It was a setup. I told him I wasn’t looking for anything serious. He said he only did serious. Fifteen years, two kids, and one mortgage later, he was right.",
  },
];

export default function SarahPage() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className="container">
          <div className={styles.backLink}>
            <a href="/archive">← Back to archive</a>
          </div>
          <div className={styles.heroTop}>
            <p className={styles.kicker}>Hookup Lists</p>
            <h1>Sarah’s List</h1>
            <p className={styles.meta}>Age 41. Female. Straight.</p>
          </div>
          <div className={styles.heroImage}>
            <Image
              src="/hl-photo.png"
              alt="Hookup Lists story cover"
              width={900}
              height={600}
              priority
            />
          </div>
          <p className={styles.intro}>
            Hookup Lists is a weekly chronicle of the highlights (and lowlights)
            from one person’s actual hookup history.
          </p>
        </div>
      </div>

      <div className={styles.entries}>
        <div className="container">
          <div className={styles.entryList}>
            {entries.map((entry) => (
              <article className={styles.entry} key={entry.title}>
                <p className={styles.age}>{entry.age}</p>
                <h2>{entry.title}</h2>
                <p>{entry.body}</p>
              </article>
            ))}
            <p className={styles.disclaimer}>
              Disclaimer: All names and identifiable details have been modified
              to protect the reputations of our contributors in the eyes of
              their partners, colleagues, and parents.
            </p>
          </div>
        </div>
      </div>

      <div className={styles.subscribe}>
        <div className="container">
          <div className={styles.subscribeCard}>
            <p>Subscribe for more from Hookup Lists, weekly in your inbox</p>
            <form
              className={styles.subscribeForm}
              action="https://magic.hookuplists.com/"
              method="get"
            >
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Email address"
                required
              />
              <button className="button button-primary" type="submit">
                Subscribe
              </button>
            </form>
            <p className={styles.formNote}>
              By entering your email you are agreeing to our{" "}
              <a href="/terms">Terms of Use</a> and{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
