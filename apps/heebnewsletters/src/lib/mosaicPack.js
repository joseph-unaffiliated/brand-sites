/**
 * Greedy mosaic packer: assign each issue to the currently shortest column
 * using per-slot height estimates, then (on the client) refine with real
 * measurements by pulling from the unused pool.
 */

const GAP = 24;
const SUBSCRIBE_HEIGHT = 340;
const SNIPPETS_TITLE = 28;

function wordCount(text) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (!clean) return 0;
  return clean.split(" ").length;
}

function estimateCard(article) {
  const dekWords = wordCount(article.cardDek || article.summary);
  // ~320px col: 3/2 image ≈ 210, title+meta+dek+padding
  return 210 + 96 + Math.ceil(dekWords / 11) * 21 + GAP;
}

function estimateFeatured(article, isLatest) {
  const previewWords = wordCount(article.featuredPreview || article.summary);
  // ~420px col: 3/2 image ≈ 280, kicker/title/meta/preview/cta
  const image = isLatest ? 300 : 260;
  const chrome = isLatest ? 130 : 110;
  return image + chrome + Math.ceil(previewWords / 9) * 22 + GAP;
}

function estimateSnippet(article) {
  const dekWords = Math.min(wordCount(article.cardDek || article.summary), 28);
  return 88 + Math.ceil(dekWords / 14) * 18 + 8;
}

/**
 * @param {Array<object>} articles mosaic-ready articles (newest first)
 * @param {{ hasSubscribe?: boolean }} [options]
 */
export function packMosaicColumns(articles, options = {}) {
  const hasSubscribe = options.hasSubscribe !== false;
  const maxLeft = options.maxLeft ?? 6;
  const maxCenter = options.maxCenter ?? 5;
  const maxRight = options.maxRight ?? 8;
  const maxItems = options.maxItems ?? 16;
  const tolerance = options.tolerance ?? 100;

  if (!Array.isArray(articles) || articles.length === 0) {
    return { left: [], center: [], right: [], unused: [] };
  }

  const [latest, ...rest] = articles;
  const left = [];
  const center = [latest];
  const right = [];
  let hLeft = 0;
  let hCenter = estimateFeatured(latest, true);
  let hRight = (hasSubscribe ? SUBSCRIBE_HEIGHT + GAP : 0) + SNIPPETS_TITLE;

  const unused = [];

  const heightOf = (key) => {
    if (key === "left") return hLeft;
    if (key === "center") return hCenter;
    return hRight;
  };

  const tryPlace = (article, force = false) => {
    const total = left.length + center.length + right.length;
    const spread = Math.max(hLeft, hCenter, hRight) - Math.min(hLeft, hCenter, hRight);
    if (!force && total >= maxItems && spread <= tolerance) return false;

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
    if (right.length < maxRight) {
      candidates.push({ key: "right", next: hRight + estimateSnippet(article) });
    }
    if (!candidates.length) return false;

    candidates.sort((a, b) => a.next - b.next);
    const pick = candidates[0];
    if (pick.key === "left") {
      left.push(article);
      hLeft = pick.next;
    } else if (pick.key === "center") {
      center.push(article);
      hCenter = pick.next;
    } else {
      right.push(article);
      hRight = pick.next;
    }
    return true;
  };

  for (const article of rest) {
    if (!tryPlace(article)) unused.push(article);
  }

  // Top up the shortest columns from unused until roughly level.
  let guard = 0;
  while (unused.length && guard < 12) {
    guard += 1;
    const spread = Math.max(hLeft, hCenter, hRight) - Math.min(hLeft, hCenter, hRight);
    if (spread <= tolerance) break;
    const order = ["left", "center", "right"].sort((a, b) => heightOf(a) - heightOf(b));
    let placed = false;
    for (const key of order) {
      const caps = { left: maxLeft, center: maxCenter, right: maxRight };
      const counts = { left: left.length, center: center.length, right: right.length };
      if (counts[key] >= caps[key]) continue;
      const article = unused.shift();
      if (!article) break;
      if (key === "left") {
        left.push(article);
        hLeft += estimateCard(article);
      } else if (key === "center") {
        center.push(article);
        hCenter += estimateFeatured(article, false);
      } else {
        right.push(article);
        hRight += estimateSnippet(article);
      }
      placed = true;
      break;
    }
    if (!placed) break;
  }

  return { left, center, right, unused };
}

function takeForShortestColumn(pack, heights) {
  const { left, center, right, unused } = pack;
  if (!unused?.length) return null;

  const measured = {
    left: heights.left ?? 0,
    center: heights.center ?? 0,
    right: heights.right ?? 0,
  };
  const spread =
    Math.max(measured.left, measured.center, measured.right) -
    Math.min(measured.left, measured.center, measured.right);
  if (spread < 120) return null;

  const caps = { left: 6, center: 5, right: 8 };
  const cols = { left, center, right };
  const order = ["left", "center", "right"].sort(
    (a, b) => measured[a] - measured[b],
  );

  for (const key of order) {
    if (cols[key].length >= caps[key]) continue;
    const [article, ...restUnused] = unused;
    return {
      left: key === "left" ? [...left, article] : left,
      center: key === "center" ? [...center, article] : center,
      right: key === "right" ? [...right, article] : right,
      unused: restUnused,
    };
  }
  return null;
}

/**
 * After real layout, prefer topping up the shortest column from unused.
 * If unused is empty but columns still diverge, move the last item from the
 * tallest column into the shortest (never leaving center without the latest).
 * Returns null when no change.
 */
export function rebalanceMosaicStep(pack, heights) {
  const toppedUp = takeForShortestColumn(pack, heights);
  if (toppedUp) return toppedUp;

  const { left, center, right, unused = [] } = pack;
  const measured = {
    left: heights.left ?? 0,
    center: heights.center ?? 0,
    right: heights.right ?? 0,
  };
  const spread =
    Math.max(measured.left, measured.center, measured.right) -
    Math.min(measured.left, measured.center, measured.right);
  if (spread < 160) return null;

  const caps = { left: 6, center: 5, right: 8 };
  const minKeep = { left: 1, center: 1, right: 1 };
  const cols = { left, center, right };

  const tallest = ["left", "center", "right"].sort(
    (a, b) => measured[b] - measured[a],
  )[0];
  const shortest = ["left", "center", "right"].sort(
    (a, b) => measured[a] - measured[b],
  )[0];
  if (tallest === shortest) return null;
  if (cols[tallest].length <= minKeep[tallest]) return null;
  if (cols[shortest].length >= caps[shortest]) return null;

  const item = cols[tallest][cols[tallest].length - 1];
  return {
    left:
      tallest === "left"
        ? left.slice(0, -1)
        : shortest === "left"
          ? [...left, item]
          : left,
    center:
      tallest === "center"
        ? center.slice(0, -1)
        : shortest === "center"
          ? [...center, item]
          : center,
    right:
      tallest === "right"
        ? right.slice(0, -1)
        : shortest === "right"
          ? [...right, item]
          : right,
    unused,
  };
}
