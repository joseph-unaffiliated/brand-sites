import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { authorBylineText } from "@/lib/article-helpers";
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
      /* fall through */
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
  return { w: dim?.width || 900, h: dim?.height || 600 };
}

function portableTextComponents(projectId, dataset) {
  return {
    block: {
      normal: ({ children, value }) => {
        const text = (value?.children || []).map((c) => c.text || "").join("").trim();
        if (text === "*") {
          return <p className={styles.sectionDivider}>*</p>;
        }
        return <p>{children}</p>;
      },
      blockquote: ({ children }) => (
        <blockquote className={styles.pullQuote}>{children}</blockquote>
      ),
    },
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
            {value?.caption || value?.credit ? (
              <figcaption className={styles.caption}>
                {value.caption ? <span>{value.caption}</span> : null}
                {value.caption && value.credit ? (
                  <span className={styles.captionSep}> · </span>
                ) : null}
                {value.credit ? <span className={styles.credit}>{value.credit}</span> : null}
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
          className={styles.featureLink}
        >
          {children}
        </a>
      ),
    },
  };
}

function renderProseSection(block, projectId, dataset) {
  const body = block.body ?? [];
  if (!Array.isArray(body) || body.length === 0) return null;
  const ptComponents = portableTextComponents(projectId, dataset);
  return (
    <section key={block._key || "prose"} className={styles.block}>
      <div className={styles.feature}>
        <PortableText value={body} components={ptComponents} />
      </div>
    </section>
  );
}

function renderSecondarySourcesBlock(block) {
  const items = block.items || [];
  if (items.length === 0) return null;
  return (
    <section
      key={block._key || "sources"}
      className={styles.secondarySources}
      aria-label="Secondary sources"
    >
      <ul className={styles.secondarySourcesList}>
        {items.map((item) => (
          <li key={item._key || item.url} className={styles.secondarySourcesItem}>
            {item.url ? (
              <Link
                href={item.url}
                rel="noopener noreferrer"
                target="_blank"
                className={styles.secondarySourcesHeadlineLink}
              >
                <h3 className={styles.secondarySourcesHeadline}>{item.headline}</h3>
              </Link>
            ) : item.headline ? (
              <h3 className={styles.secondarySourcesHeadline}>{item.headline}</h3>
            ) : null}
            {item.description ? (
              <p className={styles.secondarySourcesDescription}>
                {item.description}{" "}
                {item.url && item.ctaLabel ? (
                  <Link
                    href={item.url}
                    rel="noopener noreferrer"
                    target="_blank"
                    className={styles.secondarySourcesCta}
                  >
                    <strong>{item.ctaLabel}</strong>
                  </Link>
                ) : null}
                {item.ctaLabel ? " >" : null}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function renderContentBlock(block, projectId, dataset) {
  if (!block?._type) return null;
  switch (block._type) {
    case "proseSection":
    case "featureSection":
      return renderProseSection(block, projectId, dataset);
    case "secondarySourcesBlock":
      return renderSecondarySourcesBlock(block);
    default:
      return null;
  }
}

export default function ArticleContentBlocks({
  blocks,
  projectId,
  dataset,
  bio,
  authorName,
}) {
  if (!Array.isArray(blocks) || blocks.length === 0) return null;

  const bioTrim = typeof bio === "string" ? bio.trim() : "";
  const authorByline = authorBylineText(authorName);
  const showAuthorCard = Boolean(bioTrim);

  return (
    <div className={styles.blocks}>
      {blocks.map((block, i) => (
        <Fragment key={block._key || `block-${i}`}>
          {renderContentBlock(block, projectId, dataset)}
        </Fragment>
      ))}
      {showAuthorCard ? (
        <aside key="author-bio" className={styles.authorCard} aria-label="About the author">
          {authorByline ? <p className={styles.authorCardByline}>{authorByline}</p> : null}
          <p className={styles.authorCardBio}>{bioTrim}</p>
        </aside>
      ) : null}
    </div>
  );
}
