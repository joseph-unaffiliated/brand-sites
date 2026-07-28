import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { siteConfig } from "@/config/site";
import { buildPollVoteUrl, getOptionCode, isTriviaBlock } from "@/lib/vote-block";
import styles from "./ArticleContentBlocks.module.css";

const siteUrl = siteConfig.siteUrl.replace(/\/$/, "");

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

function hidePartHeading(heading) {
  if (typeof heading !== "string") return false;
  return /^\s*part\s+\d+\s*$/i.test(heading.trim());
}

function isPickleEconomicsLabelOnlyHeading(heading) {
  if (typeof heading !== "string") return false;
  return /^pickle economics$/i.test(heading.trim());
}

/** Split "Nibbles: Our Top Finds this Week" into eyebrow + subtitle (matches email + '90s Parent Around the Web). */
function parseNibblesHeading(heading) {
  const raw = (typeof heading === "string" && heading.trim()) || "Nibbles: Our Top Finds this Week";
  const match = raw.match(/^Nibbles:\s*(.*)$/i);
  if (match) {
    return { eyebrow: "Nibbles", title: match[1].trim() || "Our Top Finds this Week" };
  }
  return { eyebrow: "Nibbles", title: raw };
}

function nibblesCtaLabel(item) {
  const label = typeof item?.ctaLabel === "string" ? item.ctaLabel.trim() : "";
  if (label) return label;
  return "Read more";
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

function isEmptyPortableTextBlock(b) {
  if (b?._type !== "block") return false;
  return !portableTextBlockPlainText(b).trim();
}

function trimPortableTextBlock(b) {
  if (b?._type !== "block" || !Array.isArray(b.children) || b.children.length === 0) {
    return b;
  }
  const children = b.children.map((child, index) => {
    if (typeof child.text !== "string") return child;
    let text = child.text;
    if (index === 0) text = text.replace(/^\s+/, "");
    if (index === b.children.length - 1) text = text.replace(/\s+$/, "");
    return text === child.text ? child : { ...child, text };
  });
  const changed = children.some((child, index) => child !== b.children[index]);
  return changed ? { ...b, children } : b;
}

function filterPortableTextBody(body, { dropEmpty = false } = {}) {
  if (!Array.isArray(body)) return [];
  let result = body
    .map(trimPortableTextBlock)
    .filter((b) => !shouldDropDuplicateTeaserBlock(b));
  if (dropEmpty) {
    result = result.filter((b) => !isEmptyPortableTextBlock(b));
  }
  return result;
}

function filterDuplicateTeaserLines(body) {
  return filterPortableTextBody(body);
}

/** Market share chart in Pickle Addicts: intro paragraph + inline PT image. */
function hasCredit(credit) {
  if (typeof credit === "string") return Boolean(credit.trim());
  return Array.isArray(credit) && credit.length > 0;
}

function captionCreditPortableTextComponents() {
  return {
    block: {
      normal: ({ children }) => (
        <span className={styles.captionPtLine}>{children}</span>
      ),
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

function renderCredit(credit) {
  if (!hasCredit(credit)) return null;
  if (typeof credit === "string") {
    return <span className={styles.credit}>{credit}</span>;
  }
  return (
    <span className={styles.credit}>
      <PortableText value={credit} components={captionCreditPortableTextComponents()} />
    </span>
  );
}

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

/** Pickle Economics: image caption stays under chart; credit (sources) → card footer. */
function splitPickleEconomicsBody(body) {
  const filtered = filterPortableTextBody(body ?? [], { dropEmpty: true });
  const credits = [];
  const mainBody = filtered.map((item) => {
    if (item?._type === "image" && hasCredit(item.credit)) {
      credits.push(item.credit);
      return { ...item, credit: undefined };
    }
    return item;
  });
  return { mainBody, credits };
}

function portableTextComponents(projectId, dataset, { omitImageCredit = false } = {}) {
  return {
    types: {
      image: ({ value }) => {
        const src = urlForImage(projectId, dataset, value);
        if (!src) return null;
        const { w, h } = dims(value);
        const showCredit = !omitImageCredit && hasCredit(value?.credit);
        const showCaption = Boolean(value?.caption?.trim()) || showCredit;
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
            {showCaption ? (
              <figcaption className={styles.caption}>
                {value.caption ? <span>{value.caption}</span> : null}
                {value.caption && showCredit ? (
                  <span className={styles.captionSep}> · </span>
                ) : null}
                {showCredit ? renderCredit(value?.credit) : null}
              </figcaption>
            ) : null}
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

function renderPickleVoteOption(opt, index, { siteUrl, articleSlug }) {
  const code = getOptionCode(opt, index);
  const label = opt.label?.trim() || "";
  const voteUrl = buildPollVoteUrl({
    siteUrl,
    issueSlug: articleSlug,
    choiceCode: code,
    viaHome: false,
  });
  const buttonText = [code ? `${code.toUpperCase()}.` : "", label].filter(Boolean).join(" ");
  return (
    <li key={opt._key || code || index} className={styles.voteOption}>
      {voteUrl ? (
        <Link
          href={voteUrl}
          className={styles.nibblesItemLink}
          aria-label={
            buttonText
              ? `Vote: ${buttonText}`
              : code
                ? `Vote option ${code.toUpperCase()}`
                : "Vote"
          }
        >
          <span className={styles.nibblesCta}>{buttonText || "Vote"}</span>
        </Link>
      ) : (
        <span className={styles.nibblesCta}>{buttonText || "—"}</span>
      )}
    </li>
  );
}

export default function ArticleContentBlocks({ blocks, projectId, dataset, articleSlug = "" }) {
  const list = Array.isArray(blocks) ? blocks : [];
  const hasPhotoOfWeekBlock = list.some((b) => b?._type === "photoOfWeekBlock");

  if (list.length === 0) return null;

  return (
    <div className={styles.blocks}>
      {list.map((block) => {
        if (!block?._type) return null;
        const key = block._key || block._type;

        switch (block._type) {
          case "proseSection": {
            const showHeading = block.heading && !hidePartHeading(block.heading);
            const ptComponents = portableTextComponents(projectId, dataset);
            const body = filterDuplicateTeaserLines(block.body ?? []);
            if (body.length === 0) {
              return null;
            }
            const { head, chartIntro, chartImage, tail } = splitBodyAroundMarketShareChart(body);
            const hasMarketShareModule = chartIntro && chartImage;
            const proseBody = hasMarketShareModule ? [...head, ...tail] : body;

            return (
              <section key={key} className={styles.block}>
                {showHeading ? <h2 className={styles.blockHeading}>{block.heading}</h2> : null}
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
                ) : Array.isArray(proseBody) && proseBody.length > 0 ? (
                  <div className={styles.prose}>
                    <PortableText value={proseBody} components={ptComponents} />
                  </div>
                ) : null}
              </section>
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
          case "nibblesBlock": {
            const { eyebrow, title: nibblesTitle } = parseNibblesHeading(block.heading);
            const items = block.items || [];
            if (items.length === 0) return null;
            return (
              <section key={key} className={`${styles.block} ${styles.issueModule}`}>
                <aside className={`${styles.poll} ${styles.nibblesBox}`} aria-label={eyebrow}>
                  <p className={styles.eyebrow}>{eyebrow}</p>
                  {nibblesTitle ? (
                    <h2 className={styles.photoOfWeekTitle}>{nibblesTitle}</h2>
                  ) : null}
                  <ul className={styles.nibblesList}>
                    {items.map((item) => (
                      <li key={item._key || item.url}>
                        {item.url ? (
                          <Link
                            href={item.url}
                            rel="noopener noreferrer"
                            target="_blank"
                            className={styles.nibblesItemLink}
                          >
                            {item.title ? (
                              <h3 className={styles.nibblesTitle}>{item.title}</h3>
                            ) : null}
                            <span className={styles.nibblesCta}>{nibblesCtaLabel(item)}</span>
                          </Link>
                        ) : (
                          item.title ? <h3 className={styles.nibblesTitle}>{item.title}</h3> : null
                        )}
                      </li>
                    ))}
                  </ul>
                </aside>
              </section>
            );
          }
          case "pickleEconomicsSection": {
            const { mainBody, credits } = splitPickleEconomicsBody(block.body ?? []);
            if (mainBody.length === 0 && credits.length === 0) return null;
            const ptComponents = portableTextComponents(projectId, dataset, {
              omitImageCredit: true,
            });
            const showPeMainTitle =
              typeof block.heading === "string" &&
              block.heading.trim() &&
              !isPickleEconomicsLabelOnlyHeading(block.heading) &&
              !hidePartHeading(block.heading);
            return (
              <section key={key} className={`${styles.block} ${styles.issueModule}`}>
                <aside
                  className={`${styles.poll} ${styles.pickleEconomicsBox}`}
                  aria-label="Pickle Economics"
                >
                  <p className={styles.eyebrow}>Pickle Economics</p>
                  {showPeMainTitle ? (
                    <h2 className={styles.photoOfWeekTitle}>{block.heading.trim()}</h2>
                  ) : null}
                  <div className={styles.prose}>
                    <PortableText value={mainBody} components={ptComponents} />
                  </div>
                  {credits.length > 0 ? (
                    <div className={styles.pickleEconomicsCreditFooter}>
                      {credits.map((credit, creditIndex) => (
                        <p
                          key={`pe-credit-${creditIndex}`}
                          className={styles.pickleEconomicsCreditLine}
                        >
                          {renderCredit(credit)}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </aside>
              </section>
            );
          }
          case "pickleVoteBlock": {
            const headingText =
              block.heading?.trim() ||
              (isTriviaBlock(block) ? "Today's Pickle Trivia" : "Poll");
            const lastWeek = block.lastWeek;
            return (
              <section key={key} className={`${styles.block} ${styles.issueModule}`}>
                <aside className={styles.poll} aria-label={headingText}>
                  <p className={styles.eyebrow}>{headingText}</p>
                {block.question ? (
                  <h2 className={styles.photoOfWeekTitle}>{block.question}</h2>
                ) : null}
                {(() => {
                  const options = block.options || [];
                  const voteOpts = options.map((opt, index) =>
                    renderPickleVoteOption(opt, index, { siteUrl, articleSlug }),
                  );
                  if (options.length === 4) {
                    return (
                      <div className={styles.voteOptionsQuad}>
                        <ul className={styles.voteOptionsRow} aria-label="Vote options">
                          {voteOpts.slice(0, 2)}
                        </ul>
                        <ul className={styles.voteOptionsRow}>{voteOpts.slice(2, 4)}</ul>
                      </div>
                    );
                  }
                  return (
                    <ul
                      className={styles.voteOptions}
                      data-option-count={options.length}
                    >
                      {voteOpts}
                    </ul>
                  );
                })()}
                {lastWeek?.question && Array.isArray(lastWeek.results) && lastWeek.results.length > 0 ? (
                  <div className={styles.lastWeekRecap}>
                    <p className={styles.lastWeekLabel}>Last week</p>
                    <p className={styles.lastWeekQuestion}>{lastWeek.question}</p>
                    <ul className={styles.lastWeekResults}>
                      {lastWeek.results.map((r) => (
                        <li
                          key={r._key || r.code}
                          className={r.wasCorrect ? styles.lastWeekCorrect : undefined}
                        >
                          {r.label || (r.code ? String(r.code).toUpperCase() : "")}
                          {typeof r.percent === "number" ? ` — ${r.percent}%` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                </aside>
              </section>
            );
          }
          case "photoOfWeekBlock": {
            const src = block.image ? urlForImage(projectId, dataset, block.image) : null;
            const { w, h } = block.image ? dims(block.image) : { w: 900, h: 600 };
            const headingText = block.heading?.trim() || DEFAULT_PHOTO_OF_WEEK_HEADING;
            return (
              <section key={key} className={`${styles.block} ${styles.issueModule}`}>
                <aside className={styles.poll} aria-label={headingText}>
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
                  {(block.caption || hasCredit(block.credit)) && (
                    <figcaption className={styles.caption}>
                      {block.caption ? <span>{block.caption}</span> : null}
                      {block.caption && hasCredit(block.credit) ? (
                        <span className={styles.captionSep}> · </span>
                      ) : null}
                      {renderCredit(block.credit)}
                    </figcaption>
                  )}
                </figure>
                </aside>
              </section>
            );
          }
          default:
            return null;
        }
      })}
      {!hasPhotoOfWeekBlock ? (
        <section className={`${styles.block} ${styles.issueModule}`}>
          <aside
            className={`${styles.poll} ${styles.photoOfWeekFallback}`}
            aria-label={DEFAULT_PHOTO_OF_WEEK_HEADING}
          >
            <p className={styles.eyebrow}>{DEFAULT_PHOTO_OF_WEEK_HEADING}</p>
            <div className={styles.photoOfWeekPlaceholder} aria-hidden />
          </aside>
        </section>
      ) : null}
    </div>
  );
}
