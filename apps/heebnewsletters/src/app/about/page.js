import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import styles from "../basic-page.module.css";
import aboutStyles from "./page.module.css";
import articleStyles from "../article/[slug]/page.module.css";
import AboutOutreach from "./AboutOutreach";
import { siteDisplayName } from "@/config/site";
import { getArticles } from "@/lib/articles";
import { pickRandomArticles } from "@/lib/pickRandomArticles";

const description =
  "Heeb Magazine is the irreverent Jewish magazine, back from the vault: classic Heeb stories with fresh commentary in From the Vault, plus back issues and merch.";

export const metadata = {
  title: `About | ${siteDisplayName}`,
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About | ${siteDisplayName}`,
    description,
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `About | ${siteDisplayName}`,
    description,
  },
};

const READ_MORE_COUNT = 3;

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export default async function AboutPage() {
  const allArticles = await getArticles();
  const readMore = pickRandomArticles(allArticles, { count: READ_MORE_COUNT });

  return (
    <>
      <div className={styles.page}>
        <div className={aboutStyles.aboutOuter}>
          <div className={aboutStyles.aboutLayout}>
            <div className={aboutStyles.aboutMain}>
              <header className={`page-header ${aboutStyles.aboutHeader}`}>
                <h1>About {siteDisplayName}</h1>
              </header>
              <p>
                Just like Moses received the Ten Commandments on Mount Sinai,
                in 2002 the world received the very first issue of Heeb
                Magazine. Heeb&rsquo;s first Editor described the fledgling
                publication as &ldquo;a little mirror held up to the new Jewish
                world, with all its dirt and glitter.&rdquo; That mirror took
                many forms across the 22 print issues of Heeb Magazine, from
                articles to artwork, reviews to interviews, fiction to photo
                shoots.
              </p>
              <p>
                <Link href="/from-the-vault">From the Vault</Link> is our
                newsletter where we pull the dusty curtain off the mirror and
                break open the archive. Every week we dig up a Heeb feature from
                the 2000s and hand it back to you with the context, commentary,
                and side-eye it deserves.
              </p>
              <p>
                Heeb was a project in redefining what it meant to be Jewish in a
                rapidly changing world. That change has only picked up speed
                over the last two decades, but From the Vault reminds us that
                Jewish culture has always been loud, funny, a little offensive,
                and unmistakably itself. Every article is a time capsule with a
                point of view.
              </p>
              <p>
                Heeb Magazine spent the 2000s pissing off the right people: too
                Jewish for the mainstream, too irreverent for the establishment,
                too funny to ignore. This is its home again&hellip; courtesy of{" "}
                <ExternalLink href="https://heebmedia.com">Heeb Media</ExternalLink>.
              </p>

              <h2>Heeb is back!</h2>
              <p>
                In 2025, Heeb returned as Heeb Media, an independent digital
                media nonprofit that combines the spirit of the old magazine
                with the creativity and technology of a new generation.
              </p>
              <p>
                Today, in addition to this archive, Heeb Media runs a{" "}
                <ExternalLink href="https://heebmedia.com/pages/listen-1">podcast network</ExternalLink>, a{" "}
                <ExternalLink href="https://www.youtube.com/@HeebMedia">YouTube channel</ExternalLink> with
                original series, and social first programs on{" "}
                <ExternalLink href="https://www.instagram.com/heebmedia/">Instagram</ExternalLink> and{" "}
                <ExternalLink href="https://www.tiktok.com/@heebmedia">TikTok</ExternalLink>. In select
                cities, Heeb is{" "}
                <ExternalLink href="https://docs.google.com/forms/d/e/1FAIpQLSeNvD2RYtYScDoLlW_PcRczK8zwy3tkbcUaA-79zBXoIrHWvg/viewform?usp=header">
                  bringing people together
                </ExternalLink>{" "}
                for film screenings, comedy shows, fashion pop-ups, and shabbat
                dinners.
              </p>

              <h2>What we publish</h2>
              <p>
                Each article on this site is one dug-up piece of the vault: an
                editor&apos;s intro framing the piece, the original page or
                article reproduced in full, era context, and a Rabbit Hole of
                curated links for when you inevitably fall down the internet
                afterward. A readable break from the infinite scroll,
                delivered to your inbox.
              </p>
              <p>
                We cover Jewish counter-culture from the 2000s in all its
                forms: magazine pages, message-board ephemera, early internet
                Jewish humor, and the subcultures that Heeb Magazine helped
                define. No manifestos — just the good, weird, funny stuff.
              </p>

              <h2>How it works</h2>
              <p>
                Subscribe once, and a new article arrives in your inbox each
                week — one focused read you can actually finish. Browsing past
                articles in <Link href="/from-the-vault">The Vault</Link> is free anytime. Snooze and unsubscribe
                stay a click away in your mail when you need them.
              </p>

              <h2>The shop</h2>
              <p>
                The <Link href="/shop">Heeb shop</Link> is where the print run
                lives on: back issues of the magazine, shirts, stickers, and
                other objects from the archive. When a From the Vault story
                comes from an issue we still have copies of, you can buy that
                issue right under the article. Orders ship from and are
                supported by Heeb Media at{" "}
                <ExternalLink href="https://heebmedia.com">heebmedia.com</ExternalLink>, where
                checkout happens.
              </p>

              <h2>Who it&apos;s for</h2>
              <p>
                Heeb readers who never got over it, Jews who want their
                culture with an edge, and anyone curious what &ldquo;too Jewish
                for the mainstream&rdquo; actually looked like in print. If
                you remember Heeb Magazine — or wish you did — you&apos;re in
                the right place.
              </p>

              <h2>Get in touch</h2>
              <Suspense fallback={null}>
                <AboutOutreach />
              </Suspense>
            </div>
          </div>
        </div>
      </div>

      {readMore.length > 0 ? (
        <div className={articleStyles.readMoreOuter}>
          <section className={articleStyles.readMore} aria-label="More from The Vault">
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
                      alt={rec.title}
                      width={rec.mainImageWidth || 280}
                      height={rec.mainImageHeight || 187}
                      sizes="(max-width: 640px) 100vw, 280px"
                    />
                  </div>
                  <h3 className={articleStyles.readMoreHeadline}>{rec.title}</h3>
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
