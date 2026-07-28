/**
 * Greedy mosaic packer for left + center only. The right rail is a fixed-height
 * sticky stack (subscribe + N snippets) and is not stretched to match.
 */

const GAP = 24;

function wordCount(text) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return 0;
  return clean.split(" ").length;
}

function estimateCard(article) {
  const dekWords = wordCount(article.cardDek || article.summary);
  return 210 + 96 + Math.ceil(dekWords / 11) * 21 + GAP;
}

function estimateFeatured(article, isLatest) {
  const previewWords = wordCount(article.featuredPreview || article.summary);
  const image = isLatest ? 300 : 260;
  const chrome = isLatest ? 130 : 110;
  return image + chrome + Math.ceil(previewWords / 9) * 22 + GAP;
}

/**
 * @param {Array<object>} articles mosaic-ready articles (newest first)
 * @param {{ hasSubscribe?: boolean, rightCount?: number }} [options]
 */
export function packMosaicColumns(articles, options = {}) {
  const maxLeft = options.maxLeft ?? 6;
  const maxCenter = options.maxCenter ?? 5;
  const rightCount = options.rightCount ?? (options.hasSubscribe === false ? 5 : 4);
  const maxItems = options.maxItems ?? 14;
  const tolerance = options.tolerance ?? 100;

  if (!Array.isArray(articles) || articles.length === 0) {
    return { left: [], center: [], right: [], unused: [] };
  }

  const [latest, ...rest] = articles;
  const left = [];
  const center = [latest];
  let hLeft = 0;
  let hCenter = estimateFeatured(latest, true);

  // Fixed right rail — take the next N issues, do not height-balance into it.
  const right = rest.slice(0, rightCount);
  const afterRight = rest.slice(rightCount);
  const unused = [];

  const tryPlace = (article) => {
    const total = left.length + center.length;
    const spread = Math.abs(hLeft - hCenter);
    if (total >= maxItems && spread <= tolerance) return false;

    const candidates = [];
    if (left.length < maxLeft) {
      candidates.push({ key: "left", next: hLeft + estimateCard(article) });
    }
    if (center.length < maxCenter) {
      candidates.push({
        key: "center",
        next: hCenter + estimateFeatured(article, false),
      });
    }
    if (!candidates.length) return false;

    candidates.sort((a, b) => a.next - b.next);
    const pick = candidates[0];
    if (pick.key === "left") {
      left.push(article);
      hLeft = pick.next;
    } else {
      center.push(article);
      hCenter = pick.next;
    }
    return true;
  };

  for (const article of afterRight) {
    if (!tryPlace(article)) unused.push(article);
  }

  // Top up the shorter of left/center from unused.
  let guard = 0;
  while (unused.length && guard < 12) {
    guard += 1;
    if (Math.abs(hLeft - hCenter) <= tolerance) break;
    if (hLeft <= hCenter) {
      if (left.length >= maxLeft) break;
      const article = unused.shift();
      left.push(article);
      hLeft += estimateCard(article);
    } else {
      if (center.length >= maxCenter) break;
      const article = unused.shift();
      center.push(article);
      hCenter += estimateFeatured(article, false);
    }
  }

  return { left, center, right, unused };
}

function takeForShortestColumn(pack, heights) {
  const { left, center, right, unused } = pack;
  if (!unused?.length) return null;

  const hLeft = heights.left ?? 0;
  const hCenter = heights.center ?? 0;
  if (Math.abs(hLeft - hCenter) < 120) return null;

  const caps = { left: 6, center: 5 };
  const shortest = hLeft <= hCenter ? "left" : "center";
  const cols = { left, center };
  if (cols[shortest].length >= caps[shortest]) return null;

  const [article, ...restUnused] = unused;
  return {
    left: shortest === "left" ? [...left, article] : left,
    center: shortest === "center" ? [...center, article] : center,
    right,
    unused: restUnused,
  };
}

/**
 * Refine left/center only after layout. Right rail stays fixed.
 */
export function rebalanceMosaicStep(pack, heights) {
  const toppedUp = takeForShortestColumn(pack, heights);
  if (toppedUp) return toppedUp;

  const { left, center, right, unused = [] } = pack;
  const hLeft = heights.left ?? 0;
  const hCenter = heights.center ?? 0;
  if (Math.abs(hLeft - hCenter) < 160) return null;

  const caps = { left: 6, center: 5 };
  const minKeep = { left: 1, center: 1 };
  const tallest = hLeft >= hCenter ? "left" : "center";
  const shortest = tallest === "left" ? "center" : "left";
  const cols = { left, center };

  if (cols[tallest].length <= minKeep[tallest]) return null;
  if (cols[shortest].length >= caps[shortest]) return null;

  const item = cols[tallest][cols[tallest].length - 1];
  return {
    left:
      tallest === "left"
        ? left.slice(0, -1)
        : [...left, item],
    center:
      tallest === "center"
        ? center.slice(0, -1)
        : [...center, item],
    right,
    unused,
  };
}
