"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./shop.module.css";

/** Main image + thumbnails. `activeUrl` lets the variant picker switch the image. */
export default function ProductGallery({ images = [], title, activeUrl = null }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!activeUrl) return;
    const i = images.findIndex((img) => img.url === activeUrl);
    if (i >= 0) setIndex(i);
  }, [activeUrl, images]);

  const current = images[index] ?? images[0] ?? null;
  if (!current) return <div className={styles.galleryMain} aria-hidden />;

  return (
    <div className={styles.gallery}>
      <div className={styles.galleryMain}>
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt || title}
          width={current.width || 1200}
          height={current.height || 1200}
          sizes="(max-width: 860px) 100vw, 55vw"
          priority
        />
      </div>
      {images.length > 1 ? (
        <div className={styles.thumbs}>
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              className={`${styles.thumb} ${i === index ? styles.thumbActive : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Image ${i + 1} of ${images.length}`}
              aria-pressed={i === index}
            >
              <Image src={img.url} alt="" width={160} height={160} sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
