"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import SubscribeBlock from "@/components/SubscribeBlock";
import HideWhenSubscribed from "@/components/HideWhenSubscribed";
import { useSubscriber } from "@/context/SubscriberContext";
import { packMosaicColumns, rebalanceMosaicStep } from "@/lib/mosaicPack";
import styles from "@/app/page.module.css";

function MosaicCard({ article }) {
  return (
    <article className={styles.mosaicCard}>
      <Link href={`/article/${article.slug}`} className={styles.mosaicCardLink}>
        <div className={styles.mosaicCardImage}>
          <Image
            src={article.mainImage}
            alt=""
            width={400}
            height={267}
            sizes="(max-width: 900px) 100vw, 320px"
          />
        </div>
        <div className={styles.mosaicCardBody}>
          <h3 className={styles.mosaicCardHeadline}>{article.title}</h3>
          {article.eraLabel ? (
            <p className={styles.mosaicCardDemographic}>{article.eraLabel}</p>
          ) : null}
          {article.cardDek ? (
            <p className={styles.mosaicCardDek}>{article.cardDek}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function FeaturedCard({ article, index }) {
  return (
    <Link href={`/article/${article.slug}`} className={styles.featuredCard}>
      <div className={styles.featuredImage}>
        <Image
          src={article.mainImage}
          alt=""
          width={article.mainImageWidth || 900}
          height={article.mainImageHeight || 600}
          priority={index === 0}
          sizes="(max-width: 900px) 100vw, 560px"
        />
      </div>
      <div className={styles.featuredBody}>
        {index === 0 ? <p className={styles.featuredKicker}>Latest issue</p> : null}
        <h2 className={styles.featuredHeadline}>{article.title}</h2>
        {article.eraLabel ? (
          <p className={styles.featuredDek}>{article.eraLabel}</p>
        ) : null}
        {article.featuredPreview ? (
          <div className={styles.featuredEntryPreview}>
            <p className={styles.featuredEntrySnippet}>{article.featuredPreview}</p>
          </div>
        ) : null}
        <span className={styles.featuredLink}>Read more</span>
      </div>
    </Link>
  );
}

function SnippetsList({ items }) {
  if (!items?.length) return null;
  return (
    <div className={styles.snippetsList}>
      <p className={styles.snippetsListTitle}>More issues</p>
      {items.map((article) => (
        <Link
          key={article._id ?? article.slug}
          href={`/article/${article.slug}`}
          className={styles.snippetItem}
        >
          <span className={styles.snippetItemText}>
            <span className={styles.snippetTitle}>{article.title}</span>
            {article.eraLabel ? (
              <span className={styles.snippetDemographic}>{article.eraLabel}</span>
            ) : null}
            {article.cardDek ? (
              <span className={styles.snippetSummary}>{article.cardDek}</span>
            ) : null}
          </span>
          <span className={styles.snippetThumb}>
            <Image
              src={article.mainImage}
              alt=""
              width={72}
              height={72}
              sizes="72px"
            />
          </span>
        </Link>
      ))}
      <Link href="/archive" className={styles.snippetArchive}>
        See full archive
      </Link>
    </div>
  );
}

/**
 * Three-column homepage mosaic that packs issues into the shortest column
 * (estimate on first paint, then top-ups from unused using measured heights).
 */
export default function HomeMosaic({ articles, initialEmail }) {
  const { isSubscribed } = useSubscriber();
  const hasSubscribe = !isSubscribed;

  const initialPack = useMemo(
    () => packMosaicColumns(articles, { hasSubscribe }),
    [articles, hasSubscribe],
  );

  const [pack, setPack] = useState(initialPack);
  const leftRef = useRef(null);
  const centerRef = useRef(null);
  const passesRef = useRef(0);

  useEffect(() => {
    setPack(packMosaicColumns(articles, { hasSubscribe }));
    passesRef.current = 0;
  }, [articles, hasSubscribe]);

  useLayoutEffect(() => {
    if (passesRef.current >= 8) return;
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches) {
      return;
    }

    const heights = {
      left: leftRef.current?.offsetHeight ?? 0,
      center: centerRef.current?.offsetHeight ?? 0,
    };
    if (!heights.left && !heights.center) return;

    const next = rebalanceMosaicStep(pack, heights);
    if (!next) return;
    passesRef.current += 1;
    setPack(next);
  }, [pack, hasSubscribe]);

  return (
    <section className={styles.mosaic} id="subscribe">
      <div className={styles.mosaicContainer}>
        <div className={styles.mosaicLeft} ref={leftRef}>
          {pack.left.map((article) => (
            <MosaicCard key={article._id ?? article.slug} article={article} />
          ))}
        </div>

        <div className={styles.mosaicCenter} ref={centerRef}>
          {pack.center.map((article, index) => (
            <FeaturedCard
              key={article._id ?? article.slug}
              article={article}
              index={index}
            />
          ))}
        </div>

        <div className={styles.mosaicRight}>
          <HideWhenSubscribed>
            <SubscribeBlock initialEmail={initialEmail} />
          </HideWhenSubscribed>
          <SnippetsList items={pack.right} />
        </div>
      </div>
    </section>
  );
}
