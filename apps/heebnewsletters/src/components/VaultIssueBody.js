import Image from "next/image";
import { PortableText } from "next-sanity";
import styles from "./VaultIssueBody.module.css";

/** Body images are already dereferenced by the vault issue GROQ projection. */
function urlForBodyImage(asset, width = 1400) {
  if (!asset?.url) return null;
  try {
    const u = new URL(asset.url);
    if (!u.searchParams.has("w")) u.searchParams.set("w", String(width));
    u.searchParams.set("auto", "format");
    return u.toString();
  } catch {
    return asset.url;
  }
}

const components = {
  types: {
    image: ({ value }) => {
      const src = urlForBodyImage(value?.asset);
      if (!src) return null;
      const dim = value?.asset?.metadata?.dimensions;
      const w = dim?.width || 1200;
      const h = dim?.height || 800;
      return (
        <figure className={styles.figure}>
          <Image
            src={src}
            alt=""
            width={w}
            height={h}
            className={styles.figureImage}
            sizes="(max-width: 720px) 100vw, 640px"
          />
          {(value.caption || value.credit) && (
            <figcaption className={styles.figureCaption}>
              {value.caption ? <span>{value.caption}</span> : null}
              {value.caption && value.credit ? (
                <span className={styles.figureCaptionSep}> · </span>
              ) : null}
              {value.credit ? <span className={styles.figureCredit}>{value.credit}</span> : null}
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
        target="_blank"
        rel="noopener noreferrer"
        className={styles.bodyLink}
      >
        {children}
      </a>
    ),
  },
};

/** Renders a vault issue's Portable Text body (the reproduced newsletter content). */
export default function VaultIssueBody({ body }) {
  if (!Array.isArray(body) || body.length === 0) return null;
  return (
    <div className={styles.body}>
      <PortableText value={body} components={components} />
    </div>
  );
}
