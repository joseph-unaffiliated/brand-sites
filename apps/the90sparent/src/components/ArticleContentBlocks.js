import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
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

function isNostalgiaOfWeekBlockType(b) {
  return b?._type === "nostalgiaOfWeekBlock" || b?._type === "photoOfWeekBlock";
}

function isAroundTheWebBlock(b) {
  return b?._type === "aroundTheWebBlock";
}

/** Core story → (optional) author card → Nostalgia → Around the Web — matches typical issue order. */
function partitionArticleBlocks(blocks) {
  if (!Array.isArray(blocks)) {
    return { core: [], nostalgia: [], atw: [] };
  }
  const core = blocks.filter((b) => b && !isNostalgiaOfWeekBlockType(b) && !isAroundTheWebBlock(b));
  const nostalgia = blocks.filter((b) => isNostalgiaOfWeekBlockType(b));
  const atw = blocks.filter((b) => isAroundTheWebBlock(b));
  return { core, nostalgia, atw };
}

function hidePartHeading(heading) {
  if (typeof heading !== "string") return false;
  return /^\s*part\s+\d+\s*$/i.test(heading.trim());
}

function isPickleEconomicsFeatureHeading(heading) {
  if (typeof heading !== "string") return false;
  return /pickle economics|major pickle festivals/i.test(heading.trim());
}

function isPickleEconomicsLabelOnlyHeading(heading) {
  if (typeof heading !== "string") return false;
  return /^pickle economics$/i.test(heading.trim());
}

function isFestivalListicleHeading(heading) {
  if (typeof heading !== "string") return false;
  return /festival|picklesburgh|big dill|major pickle|economics/i.test(heading.trim());
}

function portableTextBlockPlainText(block) {
  if (!block || block._type !== "block") return "";
  return (block.children || []).map((c) => c.text || "").join("");
}

/** Strip duplicate teaser lines from Portable Text when they repeat UI elsewhere. */
const DROPPED_FEATURE_LINE_PATTERNS = [
  /^\s*the answer will be shared in next week'?s issue\.?\s*$/i,
  /^\s*last week'?s pickle trivia:?\s*$/i,
];

function shouldDropDuplicateTeaserBlock(b) {
  if (b?._type !== "block") return false;
  const t = portableTextBlockPlainText(b).trim();
  if (!t) return false;
  return DROPPED_FEATURE_LINE_PATTERNS.some((re) => re.test(t));
}

function filterDuplicateTeaserLines(body) {
  if (!Array.isArray(body)) return [];
  return body.filter((b) => !shouldDropDuplicateTeaserBlock(b));
}

/** Market share chart in Pickle Addicts: intro paragraph + inline PT image. */
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

/** Inline "💡 Pickle Economics" line in PT body — section header styled like Nostalgia of the Week + card box below. */
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

function captionCreditPortableTextComponents(projectId, dataset) {
  const base = portableTextComponents(projectId, dataset);
  return {
    ...base,
    block: {
      normal: ({ children }) => (
        <span className={styles.captionPtLine}>{children}</span>
      ),
    },
  };
}

function portableTextComponents(projectId, dataset) {
  return {
    types: {
      image: ({ value }) => {
        const src = urlForImage(projectId, dataset, value);
        if (!src) return null;
        const { w, h } = dims(value);
        return (
          <figure className={`${styles.figure} ${styles.featureFigure}`}>
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
          className={styles.featureLink}
        >
          {children}
        </a>
      ),
    },
  };
}

const DEFAULT_NOSTALGIA_OF_WEEK_HEADING = "Nostalgia of the Week";

function renderContentBlock(block, projectId, dataset) {
  if (!block?._type) return null;
  const key = block._key || block._type;

  switch (block._type) {
          case "proseSection":
          case "featureSection": {
            const showHeading = block.heading && !hidePartHeading(block.heading);
            const economics = isPickleEconomicsFeatureHeading(block.heading);
            const labelOnly = isPickleEconomicsLabelOnlyHeading(block.heading);
            const ptComponents = portableTextComponents(projectId, dataset);
            const body = filterDuplicateTeaserLines(block.body ?? []);
            if (body.length === 0) {
              return null;
            }
            const { head, chartIntro, chartImage, tail } = splitBodyAroundMarketShareChart(body);
            const hasMarketShareModule = chartIntro && chartImage;
            const featureBodyForEconomics = hasMarketShareModule
              ? [...head, ...tail]
              : body;
            const pickleSplit =
              !hasMarketShareModule && findPickleEconomicsBodySplit(featureBodyForEconomics);

            if (pickleSplit) {
              const showPeMainTitle =
                typeof block.heading === "string" &&
                block.heading.trim() &&
                !isPickleEconomicsLabelOnlyHeading(block.heading) &&
                !hidePartHeading(block.heading);
              return (
                <section key={key} className={styles.block}>
                  {pickleSplit.before.length > 0 ? (
                    <div className={styles.feature}>
                      <PortableText value={pickleSplit.before} components={ptComponents} />
                    </div>
                  ) : null}
                  <aside
                    className={`${styles.poll} ${styles.pickleEconomicsBox}`}
                    aria-label="Pickle Economics"
                  >
                    <p className={styles.eyebrow}>Pickle Economics</p>
                    {showPeMainTitle ? (
                      <h2 className={styles.nostalgiaOfWeekTitle}>{block.heading.trim()}</h2>
                    ) : null}
                    <div className={styles.feature}>
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
                      <div className={styles.feature}>
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
                      <div className={styles.feature}>
                        <PortableText value={tail} components={ptComponents} />
                      </div>
                    ) : null}
                  </>
                ) : Array.isArray(featureBodyForEconomics) && featureBodyForEconomics.length > 0 ? (
                  <div
                    className={`${styles.feature} ${economics ? styles.economicsFeature : ""}`}
                  >
                    <PortableText
                      value={featureBodyForEconomics}
                      components={ptComponents}
                    />
                  </div>
                ) : null}
              </section>
            );
          }
          case "listicleSection":
          case "examplesSection": {
            const ptComponents = portableTextComponents(projectId, dataset);
            const captionPtComponents = captionCreditPortableTextComponents(projectId, dataset);
            const showHeading = block.heading && !hidePartHeading(block.heading);
            const festivalList = isFestivalListicleHeading(block.heading);
            return (
              <section
                key={key}
                className={`${styles.block} ${
                  block._type === "examplesSection" ? styles.examplesBlock : ""
                } ${festivalList ? styles.economicsFestivalList : ""}`}
              >
                {showHeading ? (
                  block._type === "examplesSection" ? (
                    <h4 className={styles.examplesSectionHeading}>{block.heading}</h4>
                  ) : (
                    <h2 className={styles.blockHeading}>{block.heading}</h2>
                  )
                ) : null}
                <div className={styles.listicle}>
                  {(block.items || []).map((item, itemIdx) => {
                    const ik =
                      item._key ||
                      (block._type === "listicleSection"
                        ? `${item.itemNumber}-${item.title}`
                        : `example-${itemIdx}`);
                    const imgSrc = item.image ? urlForImage(projectId, dataset, item.image) : null;
                    const { w, h } = item.image ? dims(item.image) : { w: 900, h: 600 };
                    const hasCap =
                      typeof item.caption === "string"
                        ? Boolean(item.caption?.trim())
                        : Array.isArray(item.caption) && item.caption.length > 0;
                    const hasCred =
                      typeof item.credit === "string"
                        ? Boolean(item.credit?.trim())
                        : Array.isArray(item.credit) && item.credit.length > 0;
                    const isExamples = block._type === "examplesSection";
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
                            {!isExamples && (hasCap || hasCred) ? (
                              <figcaption className={styles.caption}>
                                {hasCap ? (
                                  typeof item.caption === "string" ? (
                                    <span>{item.caption}</span>
                                  ) : (
                                    <PortableText
                                      value={item.caption}
                                      components={captionPtComponents}
                                    />
                                  )
                                ) : null}
                                {hasCap && hasCred ? (
                                  <span className={styles.captionSep}> · </span>
                                ) : null}
                                {hasCred ? (
                                  typeof item.credit === "string" ? (
                                    <span className={styles.credit}>{item.credit}</span>
                                  ) : (
                                    <span className={styles.credit}>
                                      <PortableText
                                        value={item.credit}
                                        components={captionPtComponents}
                                      />
                                    </span>
                                  )
                                ) : null}
                              </figcaption>
                            ) : null}
                          </div>
                        ) : null}
                        <div className={styles.listicleCopy}>
                          {block._type === "listicleSection" && Number.isFinite(item.itemNumber) ? (
                            <span className={styles.itemNum}>{item.itemNumber}. </span>
                          ) : null}
                          {block._type === "listicleSection" && item.title ? (
                            <strong
                              className={festivalList ? styles.festivalItemTitle : undefined}
                            >
                              {item.title}
                            </strong>
                          ) : null}
                          {item.body ? (
                            block._type === "examplesSection" && Array.isArray(item.body) ? (
                              <div className={`${styles.exampleItemRichBody} ${styles.feature}`}>
                                <PortableText value={item.body} components={ptComponents} />
                              </div>
                            ) : (
                              <p className={styles.listicleBody}>{item.body}</p>
                            )
                          ) : null}
                          {isExamples && hasCap ? (
                            <div className={styles.exampleItemCaptionBelow}>
                              {typeof item.caption === "string" ? (
                                <span>{item.caption}</span>
                              ) : (
                                <PortableText
                                  value={item.caption}
                                  components={captionPtComponents}
                                />
                              )}
                            </div>
                          ) : null}
                          {isExamples && hasCred ? (
                            <div className={styles.exampleItemCredit}>
                              {typeof item.credit === "string" ? (
                                <span className={styles.credit}>{item.credit}</span>
                              ) : (
                                <PortableText
                                  value={item.credit}
                                  components={captionPtComponents}
                                />
                              )}
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          }
          case "nibblesBlock":
          case "aroundTheWebBlock": {
            return (
              <section key={key} className={styles.aroundTheWeb}>
                {block.heading ? (
                  <h2 className={styles.aroundTheWebSectionTitle}>{block.heading}</h2>
                ) : null}
                <ul className={styles.aroundTheWebList}>
                  {(block.items || []).map((item) => (
                    <li key={item._key || item.url}>
                      {item.url ? (
                        <Link
                          href={item.url}
                          rel="noopener noreferrer"
                          target="_blank"
                          className={styles.aroundTheWebItemLink}
                        >
                          {item.title ? <h3 className={styles.aroundTheWebTitle}>{item.title}</h3> : null}
                          <span className={styles.aroundTheWebLink}>{item.ctaLabel || "Read more"} →</span>
                        </Link>
                      ) : (
                        item.title ? <h3 className={styles.aroundTheWebTitle}>{item.title}</h3> : null
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          }
          case "pickleEconomicsSection": {
            const ptComponents = portableTextComponents(projectId, dataset);
            const body = filterDuplicateTeaserLines(block.body ?? []);
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
                    <h2 className={styles.nostalgiaOfWeekTitle}>{block.heading.trim()}</h2>
                  ) : null}
                  <div className={styles.feature}>
                    <PortableText value={body} components={ptComponents} />
                  </div>
                </aside>
              </section>
            );
          }
          case "photoOfWeekBlock":
          case "nostalgiaOfWeekBlock": {
            const captionPtComponents = captionCreditPortableTextComponents(projectId, dataset);
            const src = block.image ? urlForImage(projectId, dataset, block.image) : null;
            const { w, h } = block.image ? dims(block.image) : { w: 900, h: 600 };
            const headingText = block.heading?.trim() || DEFAULT_NOSTALGIA_OF_WEEK_HEADING;
            const hasCap = Boolean(block.caption?.trim?.());
            const hasCred =
              typeof block.credit === "string"
                ? Boolean(block.credit?.trim())
                : Array.isArray(block.credit) && block.credit.length > 0;
            return (
              <aside
                key={key}
                className={`${styles.poll} ${styles.nostalgiaCard}`}
                aria-label={headingText}
              >
                <h2 className={styles.nostalgiaSectionTitle}>{headingText}</h2>
                <figure className={`${styles.figure} ${styles.nostalgiaOfWeekFigure}`}>
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
                    <div className={styles.nostalgiaOfWeekPlaceholder} aria-hidden />
                  )}
                  {(hasCap || hasCred) && (
                    <figcaption className={styles.caption}>
                      {hasCap ? <span>{block.caption}</span> : null}
                      {hasCap && hasCred ? (
                        <span className={styles.captionSep}> · </span>
                      ) : null}
                      {hasCred ? (
                        typeof block.credit === "string" ? (
                          <span className={styles.credit}>{block.credit}</span>
                        ) : (
                          <span className={styles.credit}>
                            <PortableText
                              value={block.credit}
                              components={captionPtComponents}
                            />
                          </span>
                        )
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
}

export default function ArticleContentBlocks({
  blocks,
  projectId,
  dataset,
  articleSlug = "",
  bio,
  authorName,
}) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const bioTrim = typeof bio === "string" ? bio.trim() : "";
  const authorNameTrim = typeof authorName === "string" ? authorName.trim() : "";
  const showAuthorCard = Boolean(bioTrim);
  const { core, nostalgia, atw } = partitionArticleBlocks(blocks);

  const segments = [];
  for (const b of core) segments.push({ kind: "block", block: b });
  if (showAuthorCard) segments.push({ kind: "author" });
  if (nostalgia.length > 0) {
    for (const b of nostalgia) segments.push({ kind: "block", block: b });
  } else {
    segments.push({ kind: "nostalgiaFallback" });
  }
  for (const b of atw) segments.push({ kind: "block", block: b });

  return (
    <div className={styles.blocks}>
      {segments.map((seg, i) => {
        if (seg.kind === "author") {
          return (
            <aside
              key="author-bio"
              className={styles.authorCard}
              aria-label="About the author"
            >
              {authorNameTrim ? (
                <p className={styles.authorCardByline}>By {authorNameTrim}</p>
              ) : null}
              <p className={styles.authorCardBio}>{bioTrim}</p>
            </aside>
          );
        }
        if (seg.kind === "nostalgiaFallback") {
          return (
            <aside
              key="nostalgia-fallback"
              className={`${styles.poll} ${styles.nostalgiaOfWeekFallback}`}
              aria-label={DEFAULT_NOSTALGIA_OF_WEEK_HEADING}
            >
              <p className={styles.eyebrow}>{DEFAULT_NOSTALGIA_OF_WEEK_HEADING}</p>
              <div className={styles.nostalgiaOfWeekPlaceholder} aria-hidden />
            </aside>
          );
        }
        return (
          <Fragment key={seg.block._key || `seg-${i}`}>
            {renderContentBlock(seg.block, projectId, dataset)}
          </Fragment>
        );
      })}
    </div>
  );
}
