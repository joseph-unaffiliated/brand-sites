import Image from "next/image";
import { Suspense } from "react";
import styles from "../basic-page.module.css";
import aboutStyles from "./page.module.css";
import AboutOutreach from "./AboutOutreach";
import RecommendedArticleCards from "@/components/RecommendedArticleCards";
import { siteDisplayName } from "@/config/site";
import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";

const ABOUT_DESCRIPTION =
  `About ${siteDisplayName} — a weekly email series that tells one person's blow-up-your-life story at a time.`;

export const metadata = {
  title: `About | ${siteDisplayName}`,
  description: ABOUT_DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${siteDisplayName}`,
    description: ABOUT_DESCRIPTION,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDisplayName}`,
    description: ABOUT_DESCRIPTION,
  },
};

const READ_MORE_COUNT = 3;

export default async function AboutPage() {
  const allArticles = await getArticles();
  const readMore = pickRandomArticles(allArticles, { count: READ_MORE_COUNT });

  return (
    <>
      <div className={styles.page}>
        <div className={aboutStyles.aboutOuter}>
          <div className={aboutStyles.aboutLayout}>
            <div className={aboutStyles.aboutMain}>
              <h1 className={aboutStyles.aboutTitle}>
                About {siteDisplayName}
              </h1>
              <p>
                {siteDisplayName} is a weekly email series that tells one
                person&apos;s blow-up-your-life-and-leave-it-in-shambles story at
                a time. We take the reader on a full journey from the status quo,
                the moment it collapsed, and how people picked up the pieces.
              </p>
              <p>
                Each edition delivers the hard, the heartfelt, and the hilarious,
                directly to your inbox.
              </p>
              <figure className={aboutStyles.aboutFigure}>
                <Image
                  src="/hr-photo.png"
                  alt="Hard Resets"
                  width={960}
                  height={640}
                  className={aboutStyles.aboutFigureImage}
                  sizes="(min-width: 900px) 480px, 100vw"
                />
              </figure>

              <h2>What we publish</h2>
              <p>
                We share stories of all kinds. Ever wondered what it&apos;s like
                to quit a six-figure corporate job to become a children&apos;s
                party clown? You can find out here. Are you curious about what
                happens after people find the courage to leave their country
                after a catastrophe, or how people rebuild a new life without a
                longtime partner? We cover it all and more.
              </p>
              <p>
                Each edition is one full issue that will leave you with new ideas
                about how we evolve when life pulls the rug out from under us.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new issue arrives in your inbox each week —
                one focused read you can actually finish. Browsing past articles
                in the archive is free anytime. Snooze and unsubscribe stay a
                click away in your mail if you need them.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Anyone interested in genuine, relatable stories of people
                completely starting over and finding themselves transformed. If
                you catch yourself wondering what it&apos;s like to take a chance
                or make a major change, you&apos;re in the right place.
              </p>

              <h2>Get in touch</h2>
              <Suspense fallback={null}>
                <AboutOutreach />
              </Suspense>
            </div>

            <aside
              className={aboutStyles.aboutPhoneAside}
              aria-label="Hard Resets brand"
            >
              <Image
                src="/hr-phone.png"
                alt="Hard Resets"
                width={800}
                height={1600}
                className={aboutStyles.aboutPhoneImage}
                sizes="(min-width: 900px) 420px, min(92vw, 360px)"
              />
            </aside>
          </div>
        </div>
      </div>

      <RecommendedArticleCards articles={readMore} title={null} />
    </>
  );
}
