import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import PollBlockClient from "./PollBlockClient";
import styles from "./ArticleContentBlocks.module.css";

function urlForImage(projectId, dataset, source) {
  if (!projectId || !dataset || !source?.asset) return null;
  const a = source.asset;
  const ref = a._ref || (typeof a._id === "string" ? a._id : null);
  if (ref) {
    try {
      const normalized = { ...source, asset: { _ref: ref } };
      return createImageUrlBuilder({ projectId, dataset })
        .image(normalized)
        .width(1400)
        .url();
    } catch {
      /* fall through to direct CDN URL when builder rejects an edge-case ref */
    }
  }
  if (typeof a.url === "string" && /^https:\/\/cdn\.sanity\.io\//.test(a.url)) {
    try {
      const u = new URL(a.url);
      if (!u.searchParams.has("w")) u.searchParams.set("w", "1400");
      return u.toString();
    } catch {
      return a.url;
    }
  }
  return null;
}

function dims(source) {
  const dim = source?.asset?.metadata?.dimensions;
  const w = dim?.width;
  const h = dim?.height;
  return { w: w || 900, h: h || 600 };
}

function orderPhotoOfWeekLast(blocks) {
  if (!Array.isArray(blocks)) return [];
  const pow = blocks.filter((b) => b?._type === "photoOfWeekBlock");
  const rest = blocks.filter((b) => b?._type !== "photoOfWeekBlock");
  return [...rest, ...pow];
}

function hidePartHeading(heading) {
  if (typeof heading !== "string") return false;
  return /^\s*part\s+\d+\s*$/i.test(heading.trim());
}

function isPickleEconomicsProseHeading(heading) {
  if (typeof heading !== "string") return false;
  return /pickle economics|major pickle festivals/i.test(heading.trim());
}

function isPickleEconomicsLabelOnlyHeading(heading) {
  if (typeof heading !== "string") return false;
  return /^pickle economics$/i.test(heading.trim());
}

function isPickleEconomicsDidYouKnow(block) {
  const t = `${block?.title || ""} ${block?.eyebrow || ""}`;
  return /pickle economics/i.test(t);
}

function isFestivalListicleHeading(heading) {
  if (typeof heading !== "string") return false;
  return /festival|picklesburgh|big dill|major pickle|economics/i.test(heading.trim());
}

function portableTextBlockPlainText(block) {
  if (!block || block._type !== "block") return "";
  return (block.children || []).map((c) => c.text || "").join("");
}

/** Copy duplicated from poll module; keep trivia only in pollBlock. */
const DROPPED_PROSE_LINE_PATTERNS = [
  /^\s*the answer will be shared in next week'?s issue\.?\s*$/i,
  /^\s*last week'?s pickle trivia:?\s*$/i,
];

function shouldDropPollDuplicateProseBlock(b) {
  if (b?._type !== "block") return false;
  const t = portableTextBlockPlainText(b).trim();
  if (!t) return false;
  return DROPPED_PROSE_LINE_PATTERNS.some((re) => re.test(t));
}

function filterPollDuplicateProseLines(body) {
  if (!Array.isArray(body)) return [];
  return body.filter((b) => !shouldDropPollDuplicateProseBlock(b));
}

/** Market share chart in Pickle Addicts: intro paragraph + PT image (not a didYouKnow block). */
function splitBodyAroundMarketShareChart(body) {
  if (!Array.isArray(body)) {
    return { head: [], chartIntro: null, chartImage: null, tail: [] };
  }
  const idx = body.findIndex(
    (b, i) =>
      b?._type === "block" &&
      portableTextBlockPlainText(b).includes("Shares based on combined global pickle") &&
      body[i + 1]?._type === "image",
  );
  if (idx < 0) {
    return { head: body, chartIntro: null, chartImage: null, tail: [] };
  }
  return {
    head: body.slice(0, idx),
    chartIntro: body[idx],
    chartImage: body[idx + 1],
    tail: body.slice(idx + 2),
  };
}

/** Inline "💡 Pickle Economics" line in PT body — section header styled like Photo of Week + poll-style box below. */
function isPickleEconomicsInlineSectionParagraph(b) {
  if (b?._type !== "block") return false;
  const t = portableTextBlockPlainText(b).trim();
  return /^\s*💡\s*Pickle Economics\s*$/i.test(t) || /^\s*Pickle Economics\s*$/i.test(t);
}

function findPickleEconomicsBodySplit(body) {
  if (!Array.isArray(body)) return null;
  const idx = body.findIndex((b) => isPickleEconomicsInlineSectionParagraph(b));
  if (idx < 0) return null;
  return { before: body.slice(0, idx), after: body.slice(idx + 1) };
}

function portableTextComponents(projectId, dataset) {
  return {
    types: {
      image: ({ value }) => {
        const src = urlForImage(projectId, dataset, value);
        if (!src) return null;
        const { w, h } = dims(value);
        return (
          <figure className={`${styles.figure} ${styles.proseFigure}`}>
            <Image
              src={src}
              alt=""
              width={w}
              height={h}
              className={styles.blockImage}
              sizes="(max-width: 900px) 100vw, 820px"
            />
            {(value?.caption || value?.credit) && (
              <figcaption className={styles.caption}>
                {value.caption ? <span>{value.caption}</span> : null}
                {value.caption && value.credit ? (
                  <span className={styles.captionSep}> · </span>
                ) : null}
                {value.credit ? (
                  <span className={styles.credit}>{value.credit}</span>
                ) : null}
              </figcaption>
            )}
          </figure>
        );
      },
    },
    marks: {
      link: ({ children, value }) => (
        <a
          href={value?.href}
          rel="noopener noreferrer"
          target="_blank"
          className={styles.proseLink}
        >
          {children}
        </a>
      ),
    },
  };
}

const DEFAULT_PHOTO_OF_WEEK_HEADING = "Sexy Pic(kle) of the Week";

export default function ArticleContentBlocks({ blocks, projectId, dataset, articleSlug = "" }) {
  const orderedBlocks = orderPhotoOfWeekLast(blocks ?? []);
  const hasPhotoOfWeekBlock = orderedBlocks.some((b) => b?._type === "photoOfWeekBlock");

  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  return (
    <div className={styles.blocks}>
      {orderedBlocks.map((block) => {
        if (!block?._type) return null;
        const key = block._key || block._type;

        switch (block._type) {
          case "proseSection": {
            const showHeading = block.heading && !hidePartHeading(block.heading);
            const economics = isPickleEconomicsProseHeading(block.heading);
            const labelOnly = isPickleEconomicsLabelOnlyHeading(block.heading);
            const ptComponents = portableTextComponents(projectId, dataset);
            const body = filterPollDuplicateProseLines(block.body ?? []);
            if (body.length === 0) {
              return null;
            }
            const { head, chartIntro, chartImage, tail } = splitBodyAroundMarketShareChart(body);
            const hasMarketShareModule = chartIntro && chartImage;
            const proseBodyForEconomics = hasMarketShareModule
              ? [...head, ...tail]
              : body;
            const pickleSplit =
              !hasMarketShareModule && findPickleEconomicsBodySplit(proseBodyForEconomics);

            if (pickleSplit) {
              const showPeMainTitle =
                typeof block.heading === "string" &&
                block.heading.trim() &&
                !isPickleEconomicsLabelOnlyHeading(block.heading) &&
                !hidePartHeading(block.heading);
              return (
                <section key={key} className={styles.block}>
                  {pickleSplit.before.length > 0 ? (
                    <div className={styles.prose}>
                      <PortableText value={pickleSplit.before} components={ptComponents} />
                    </div>
                  ) : null}
                  <aside
                    className={`${styles.poll} ${styles.pickleEconomicsBox}`}
                    aria-label="Pickle Economics"
                  >
                    <p className={styles.eyebrow}>Pickle Economics</p>
                    {showPeMainTitle ? (
                      <h2 className={styles.photoOfWeekTitle}>{block.heading.trim()}</h2>
                    ) : null}
                    <div className={styles.prose}>
                      <PortableText value={pickleSplit.after} components={ptComponents} />
                    </div>
                  </aside>
                </section>
              );
            }

            return (
              <section
                key={key}
                className={`${styles.block} ${economics ? styles.economicsModule : ""}`}
              >
                {economics ? (
                  <div className={styles.economicsLabelRow}>
                    <span className={styles.economicsIcon} aria-hidden>
                      💡
                    </span>
                    <span className={styles.economicsLabelText}>Pickle Economics</span>
                  </div>
                ) : null}
                {!economics && showHeading ? (
                  <h2 className={styles.blockHeading}>{block.heading}</h2>
                ) : null}
                {economics && block.heading && !labelOnly ? (
                  <h2 className={styles.economicsMainTitle}>{block.heading}</h2>
                ) : null}
                {hasMarketShareModule ? (
                  <>
                    {head.length > 0 ? (
                      <div className={styles.prose}>
                        <PortableText value={head} components={ptComponents} />
                      </div>
                    ) : null}
                    <aside
                      className={`${styles.block} ${styles.economicsModule} ${styles.marketShareModule}`}
                      aria-label="Did you know"
                    >
                      <div className={styles.economicsLabelRow}>
                        <span className={styles.economicsIcon} aria-hidden>
                          💡
                        </span>
                        <span className={styles.economicsLabelText}>Did you know...</span>
                      </div>
                      <h2 className={styles.economicsMainTitle}>
                        Breakdown of Market Share by Pickle Type
                      </h2>
                      <div className={styles.marketShareIntro}>
                        <PortableText value={[chartIntro]} components={ptComponents} />
                      </div>
                      {(() => {
                        const src = urlForImage(projectId, dataset, chartImage);
                        if (!src) return null;
                        const { w, h } = dims(chartImage);
                        return (
                          <div className={styles.economicsChartWrap}>
                            <Image
                              src={src}
                              alt=""
                              width={w}
                              height={h}
                              className={`${styles.blockImage} ${styles.economicsChart}`}
                              sizes="(max-width: 900px) 100vw, 820px"
                            />
                          </div>
                        );
                      })()}
                    </aside>
                    {tail.length > 0 ? (
                      <div className={styles.prose}>
                        <PortableText value={tail} components={ptComponents} />
                      </div>
                    ) : null}
                  </>
                ) : Array.isArray(proseBodyForEconomics) && proseBodyForEconomics.length > 0 ? (
                  <div
                    className={`${styles.prose} ${economics ? styles.economicsProse : ""}`}
                  >
                    <PortableText
                      value={proseBodyForEconomics}
                      components={ptComponents}
                    />
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
              <figure key={key} className={`${styles.figure} ${styles.proseFigure}`}>
                <Image src={src} alt="" width={w} height={h} className={styles.blockImage} sizes="(max-width: 900px) 100vw, 820px" />
                {(block.caption || block.credit) && (
                  <figcaption className={styles.caption}>
                    {block.caption ? <span>{block.caption}</span> : null}
                    {block.caption && block.credit ? (
                      <span className={styles.captionSep}> · </span>
                    ) : null}
                    {block.credit ? (
                      <span className={styles.credit}>{block.credit}</span>
                    ) : null}
                  </figcaption>
                )}
              </figure>
            );
          }
          case "listicleSection": {
            const showHeading = block.heading && !hidePartHeading(block.heading);
            const festivalList = isFestivalListicleHeading(block.heading);
            return (
              <section
                key={key}
                className={`${styles.block} ${festivalList ? styles.economicsFestivalList : ""}`}
              >
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
                                {item.caption ? <span>{item.caption}</span> : null}
                                {item.caption && item.credit ? (
                                  <span className={styles.captionSep}> · </span>
                                ) : null}
                                {item.credit ? (
                                  <span className={styles.credit}>{item.credit}</span>
                                ) : null}
                              </p>
                            )}
                          </div>
                        ) : null}
                        <div className={styles.listicleCopy}>
                          {Number.isFinite(item.itemNumber) ? (
                            <span className={styles.itemNum}>{item.itemNumber}. </span>
                          ) : null}
                          {item.title ? (
                            <strong
                              className={festivalList ? styles.festivalItemTitle : undefined}
                            >
                              {item.title}
                            </strong>
                          ) : null}
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
            const economics = isPickleEconomicsDidYouKnow(block);
            if (economics) {
              return (
                <aside key={key} className={`${styles.block} ${styles.economicsModule}`}>
                  <div className={styles.economicsLabelRow}>
                    <span className={styles.economicsIcon} aria-hidden>
                      💡
                    </span>
                    <span className={styles.economicsLabelText}>Pickle Economics</span>
                  </div>
                  {block.title ? (
                    <h2 className={styles.economicsMainTitle}>{block.title}</h2>
                  ) : null}
                  {block.description ? (
                    <p className={styles.economicsIntro}>{block.description}</p>
                  ) : null}
                  {src ? (
                    <div className={styles.economicsChartWrap}>
                      <Image
                        src={src}
                        alt=""
                        width={w}
                        height={h}
                        className={`${styles.blockImage} ${styles.economicsChart}`}
                        sizes="(max-width: 900px) 100vw, 820px"
                      />
                    </div>
                  ) : null}
                </aside>
              );
            }
            return (
              <aside key={key} className={styles.dyk}>
                {block.eyebrow ? <p className={styles.eyebrow}>{block.eyebrow}</p> : null}
                {block.title ? <h2 className={styles.blockHeading}>{block.title}</h2> : null}
                {block.description ? (
                  <p className={styles.dykBody}>{block.description}</p>
                ) : null}
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    width={w}
                    height={h}
                    className={styles.blockImage}
                    sizes="(max-width: 900px) 100vw, 820px"
                  />
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
          case "pickleEconomicsSection": {
            const ptComponents = portableTextComponents(projectId, dataset);
            const body = filterPollDuplicateProseLines(block.body ?? []);
            if (body.length === 0) return null;
            const showPeMainTitle =
              typeof block.heading === "string" &&
              block.heading.trim() &&
              !isPickleEconomicsLabelOnlyHeading(block.heading) &&
              !hidePartHeading(block.heading);
            return (
              <section key={key} className={styles.block}>
                <aside
                  className={`${styles.poll} ${styles.pickleEconomicsBox}`}
                  aria-label="Pickle Economics"
                >
                  <p className={styles.eyebrow}>Pickle Economics</p>
                  {showPeMainTitle ? (
                    <h2 className={styles.photoOfWeekTitle}>{block.heading.trim()}</h2>
                  ) : null}
                  <div className={styles.prose}>
                    <PortableText value={body} components={ptComponents} />
                  </div>
                </aside>
              </section>
            );
          }
          case "pollBlock": {
            return <PollBlockClient key={key} block={block} articleSlug={articleSlug} />;
          }
          case "photoOfWeekBlock": {
            const src = block.image ? urlForImage(projectId, dataset, block.image) : null;
            const { w, h } = block.image ? dims(block.image) : { w: 900, h: 600 };
            const headingText = block.heading?.trim() || DEFAULT_PHOTO_OF_WEEK_HEADING;
            return (
              <aside key={key} className={styles.poll} aria-label={headingText}>
                <p className={styles.eyebrow}>{headingText}</p>
                <figure className={`${styles.figure} ${styles.photoOfWeekFigure}`}>
                  {src ? (
                    <Image
                      src={src}
                      alt=""
                      width={w}
                      height={h}
                      className={styles.blockImage}
                      sizes="(max-width: 900px) 100vw, 820px"
                    />
                  ) : (
                    <div className={styles.photoOfWeekPlaceholder} aria-hidden />
                  )}
                  {(block.caption || block.credit) && (
                    <figcaption className={styles.caption}>
                      {block.caption ? <span>{block.caption}</span> : null}
                      {block.caption && block.credit ? (
                        <span className={styles.captionSep}> · </span>
                      ) : null}
                      {block.credit ? (
                        <span className={styles.credit}>{block.credit}</span>
                      ) : null}
                    </figcaption>
                  )}
                </figure>
              </aside>
            );
          }
          default:
            return null;
        }
      })}
      {!hasPhotoOfWeekBlock ? (
        <aside
          className={`${styles.poll} ${styles.photoOfWeekFallback}`}
          aria-label={DEFAULT_PHOTO_OF_WEEK_HEADING}
        >
          <p className={styles.eyebrow}>{DEFAULT_PHOTO_OF_WEEK_HEADING}</p>
          <div className={styles.photoOfWeekPlaceholder} aria-hidden />
        </aside>
      ) : null}
    </div>
  );
}
