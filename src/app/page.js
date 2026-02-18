import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroInner}>
            <div className={styles.heroGrid}>
              <div className={styles.heroVisual}>
                <Image
                  src="/hl-phone.png"
                  alt="Hookup Lists issue preview"
                  width={240}
                  height={390}
                  priority
                />
              </div>
              <div className={styles.heroCopy}>
                <h1>Stories to Make Your Inner 13 y/o Blush</h1>
                <p className={styles.lede}>
                  <em>Hookup Lists</em> is a weekly chronicle of one (anonymized)
                  person's real-life hookup history, from preteen crushes to
                  awkward midlife flings. Each week, someone volunteers as
                  tribute and walks us through their personal highlight (and
                  lowlight) reel, delivered straight to your inbox.
                </p>
                <div className={styles.formWrap} id="subscribe">
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
                <div className={styles.secondaryLinks}>
                  <a href="/archive">Read past issues</a>
                  <span>·</span>
                  <a href="/about">Learn about the project</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
