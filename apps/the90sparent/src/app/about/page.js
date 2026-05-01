import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../basic-page.module.css";
import aboutStyles from "./page.module.css";
import articleStyles from "../article/[slug]/page.module.css";
import AboutOutreach from "./AboutOutreach";
import { siteDisplayName, siteKickerLower } from "@/config/site";
import { getArticles } from "@/lib/articles";

export const metadata = {
  title: `About | ${siteDisplayName}`,
};

const READ_MORE_COUNT = 3;

export default async function AboutPage() {
  const allArticles = await getArticles();
  const readMore = allArticles.slice(0, READ_MORE_COUNT);

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
                {siteDisplayName} is a weekly email series that unpacks one
                modern parenting topic at a time and holds it next to the way we
                grew up—honest, funny, a little nostalgic, and never pretending
                there&apos;s one right answer. We&apos;re not here to
                romanticize the past as if we&apos;d replay every detail exactly
                as it was; we&apos;re here because the questions are real, and
                the craving for a foregone time is complicated.
              </p>
              <p>
                Each edition is <strong>one full issue you can finish</strong>—a
                readable break from the infinite scroll, the push notification
                guilt trip, and the performative &ldquo;perfect parent&rdquo;
                feed. Humor, honesty, and a dial-up state of mind in a broadband
                world, delivered to your inbox.
              </p>
              <figure className={aboutStyles.rotaryFigure}>
                <Image
                  src="/images/about/rotary-phone.png"
                  alt="Rotary phone on a side table, nostalgic 1990s home setting"
                  width={960}
                  height={640}
                  className={aboutStyles.rotaryImage}
                  sizes="(min-width: 900px) 480px, 100vw"
                />
              </figure>

              <h2>What we publish</h2>
              <p>
                We write about what it feels like to parent in 2026 while part
                of you aches for the nostalgia of a bygone era—not because you
                literally want everything back as it was, but because
                you&apos;re trying to sort signal from noise. No manifestos.
                Just exploring how other people are grappling with the same
                tensions you are.
              </p>
              <p>
                Topics might include gentle parenting; picky eaters;
                over-the-top birthday parties; screen time; expensive
                babysitters—and the question underneath: have things really
                gotten better since we were kids? Worse? Maybe they&apos;re
                just… different?
              </p>
              <p>
                We&apos;re not here to romanticize riding in the trunk of a
                station wagon (okay, maybe a little); we&apos;re here to ask
                what&apos;s worth borrowing from yesterday and what&apos;s
                better left behind.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new issue arrives in your inbox each
                week—one focused read you can actually finish. Browsing past
                articles in the archive is free anytime. Snooze and unsubscribe
                stay a click away in your mail when you need them.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Toddlers, tweens, teens, or a household that feels like a
                conference call between generations—if you catch yourself
                comparing how you&apos;re raising kids to how you were raised,
                and you don&apos;t always know which side of that comparison you
                believe, you&apos;re in the right place.
              </p>

              <h2>Get in touch</h2>
              <Suspense fallback={null}>
                <AboutOutreach />
              </Suspense>
            </div>

            <aside
              className={aboutStyles.aboutPhoneAside}
              aria-label="Newsletter in your inbox"
            >
              <Image
                src="/images/about/email-phone-mockup.png"
                alt="Example of a published issue in an email, shown on a phone"
                width={800}
                height={1600}
                className={aboutStyles.aboutPhoneImage}
                sizes="(min-width: 900px) 420px, min(92vw, 360px)"
              />
            </aside>
          </div>
        </div>
      </div>

      {readMore.length > 0 ? (
        <div className={articleStyles.readMoreOuter}>
          <section className={articleStyles.readMore} aria-label="Keep reading">
            <div className={articleStyles.readMoreGrid}>
              {readMore.map((rec) => (
                <Link
                  key={rec._id ?? rec.slug}
                  href={`/article/${rec.slug}`}
                  className={articleStyles.readMoreCard}
                >
                  <div className={articleStyles.readMoreThumb}>
                    <Image
                      src={rec.mainImage}
                      alt=""
                      width={280}
                      height={187}
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                  </div>
                  {rec.kicker &&
                  rec.kicker.trim().toLowerCase() !== siteKickerLower ? (
                    <p className={articleStyles.readMoreKicker}>{rec.kicker}</p>
                  ) : null}
                  <h3 className={articleStyles.readMoreHeadline}>
                    {rec.title}
                  </h3>
                  {rec.summary ? (
                    <p className={articleStyles.readMoreDek}>{rec.summary}</p>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
