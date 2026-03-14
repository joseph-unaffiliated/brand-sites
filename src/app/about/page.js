import Link from "next/link";
import SubscribeCta from "@/components/SubscribeCta";
import styles from "../basic-page.module.css";

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className="container">
        <h1>About Hookup Lists</h1>
        <p>
          Hookup Lists is a weekly email series: one person’s real-life hookup
          history, anonymized and shared. From preteen crushes to awkward
          midlife flings, each issue is a first-person chronicle of the
          highlights (and lowlights) that actually happened—delivered straight to
          your inbox.
        </p>

        <h2>How it works</h2>
        <p>
          Every week, someone volunteers as tribute and walks us through their
          story. We publish it as an issue: a mix of nostalgia, cringe, and
          sometimes “and that’s how we ended up married.” Names and identifying
          details are changed to protect the guilty. You subscribe once, and we
          send you each new issue for free.
        </p>

        <h2>Why we made it</h2>
        <p>
          Hookup Lists is for anyone who’s ever kept a diary, swapped stories
          with friends, or wondered how other people’s romantic lives actually
          play out. It’s personal, specific, and a little embarrassing—on
          purpose.
        </p>

        <h2>Explore and subscribe</h2>
        <SubscribeCta />

        <p>
          Questions? Reach us at{" "}
          <a href="mailto:contact@hookuplists.com">contact@hookuplists.com</a>.
        </p>
      </div>
    </div>
  );
}
