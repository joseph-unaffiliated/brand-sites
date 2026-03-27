import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import styles from "./ArticleContentBlocks.module.css";

function urlForImage(projectId, dataset, source) {
  if (!projectId || !dataset || !source?.asset?._ref) return null;
  try {
    return imageUrlBuilder({ projectId, dataset }).image(source).width(1400).url();
  } catch {
    return null;
  }
}

function dims(source) {
  const w = source?.asset?.metadata?.dimensions?.width;
  const h = source?.asset?.metadata?.dimensions?.height;
  return { w: w || 900, h: h || 600 };
}

function hidePartHeading(heading) {
  if (typeof heading !== "string") return false;
  return /^\s*part\s+\d+\s*$/i.test(heading.trim());
}

export default function ArticleContentBlocks({ blocks, projectId, dataset }) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className={styles.blocks}>
      {blocks.map((block) => {
        if (!block?._type) return null;
        const key = block._key || block._type;

        switch (block._type) {
          case "proseSection": {
            const showHeading = block.heading && !hidePartHeading(block.heading);
            return (
              <section key={key} className={styles.block}>
                {showHeading ? <h2 className={styles.blockHeading}>{block.heading}</h2> : null}
                {Array.isArray(block.body) && block.body.length > 0 ? (
                  <div className={styles.prose}>
                    <PortableText value={block.body} />
                  </div>
                ) : null}
              </section>
            );
          }
          case "imageBlock": {
            const src = urlForImage(projectId, dataset, block.image);
            if (!src) return null;
            const { w, h } = dims(block.image);
            return (
              <figure key={key} className={styles.figure}>
                <Image src={src} alt="" width={w} height={h} className={styles.blockImage} sizes="(max-width: 900px) 100vw, 820px" />
                {(block.caption || block.credit) && (
                  <figcaption className={styles.caption}>
                    {block.caption}
                    {block.caption && block.credit ? " · " : ""}
                    {block.credit}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "listicleSection": {
            const showHeading = block.heading && !hidePartHeading(block.heading);
            return (
              <section key={key} className={styles.block}>
                {showHeading ? <h2 className={styles.blockHeading}>{block.heading}</h2> : null}
                <div className={styles.listicle}>
                  {(block.items || []).map((item) => {
                    const ik = item._key || `${item.itemNumber}-${item.title}`;
                    const imgSrc = item.image ? urlForImage(projectId, dataset, item.image) : null;
                    const { w, h } = item.image ? dims(item.image) : { w: 900, h: 600 };
                    return (
                      <article key={ik} className={styles.listicleItem}>
                        {imgSrc ? (
                          <div className={styles.listicleImageWrap}>
                            <Image
                              src={imgSrc}
                              alt=""
                              width={Math.min(w, 900)}
                              height={Math.min(h, 700)}
                              className={styles.blockImage}
                              sizes="(max-width: 900px) 100vw, 720px"
                            />
                            {(item.caption || item.credit) && (
                              <p className={styles.caption}>
                                {item.caption}
                                {item.caption && item.credit ? " · " : ""}
                                {item.credit}
                              </p>
                            )}
                          </div>
                        ) : null}
                        <div className={styles.listicleCopy}>
                          {Number.isFinite(item.itemNumber) ? (
                            <span className={styles.itemNum}>{item.itemNumber}. </span>
                          ) : null}
                          {item.title ? <strong>{item.title}</strong> : null}
                          {item.body ? <p className={styles.listicleBody}>{item.body}</p> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          }
          case "didYouKnowBlock": {
            const src = block.chartImage ? urlForImage(projectId, dataset, block.chartImage) : null;
            const { w, h } = block.chartImage ? dims(block.chartImage) : { w: 900, h: 600 };
            return (
              <aside key={key} className={styles.dyk}>
                {block.eyebrow ? <p className={styles.eyebrow}>{block.eyebrow}</p> : null}
                {block.title ? <h2 className={styles.blockHeading}>{block.title}</h2> : null}
                {block.description ? <p>{block.description}</p> : null}
                {src ? (
                  <Image src={src} alt="" width={w} height={h} className={styles.blockImage} sizes="(max-width: 900px) 100vw, 820px" />
                ) : null}
              </aside>
            );
          }
          case "nibblesBlock": {
            return (
              <section key={key} className={styles.nibbles}>
                {block.heading ? <h2 className={styles.blockHeading}>{block.heading}</h2> : null}
                <ul className={styles.nibblesList}>
                  {(block.items || []).map((item) => (
                    <li key={item._key || item.url}>
                      {item.title ? <h3 className={styles.nibblesTitle}>{item.title}</h3> : null}
                      {item.url ? (
                        <Link href={item.url} rel="noopener noreferrer" target="_blank" className={styles.nibblesLink}>
                          {item.ctaLabel || "Read more"} →
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          case "pollBlock": {
            return (
              <aside key={key} className={styles.poll}>
                {block.heading ? <p className={styles.eyebrow}>{block.heading}</p> : null}
                {block.question ? <h2 className={styles.blockHeading}>{block.question}</h2> : null}
                <ol className={styles.pollOpts}>
                  {(block.options || []).map((opt) => (
                    <li key={opt._key || opt.code}>
                      {opt.code ? `${opt.code}) ` : ""}
                      {opt.text}
                    </li>
                  ))}
                </ol>
                {block.answerTeaser ? <p className={styles.pollTeaser}>{block.answerTeaser}</p> : null}
                {block.lastWeekQuestion ? <p className={styles.pollLastQ}>{block.lastWeekQuestion}</p> : null}
                {(block.lastWeekResults || []).length > 0 ? (
                  <ul className={styles.pollResults}>
                    {block.lastWeekResults.map((r) => (
                      <li key={r._key || r.label}>
                        {r.isCorrect ? "✅" : "❌"} {Number.isFinite(r.percent) ? `${r.percent}%` : ""} — {r.label}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </aside>
            );
          }
          case "photoOfWeekBlock": {
            const src = block.image ? urlForImage(projectId, dataset, block.image) : null;
            const { w, h } = block.image ? dims(block.image) : { w: 900, h: 600 };
            if (!src) return null;
            return (
              <figure key={key} className={styles.figure}>
                {block.heading ? <p className={styles.eyebrow}>{block.heading}</p> : null}
                <Image src={src} alt="" width={w} height={h} className={styles.blockImage} sizes="(max-width: 900px) 100vw, 820px" />
                {(block.caption || block.credit) && (
                  <figcaption className={styles.caption}>
                    {block.caption}
                    {block.caption && block.credit ? " · " : ""}
                    {block.credit}
                  </figcaption>
                )}
              </figure>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
