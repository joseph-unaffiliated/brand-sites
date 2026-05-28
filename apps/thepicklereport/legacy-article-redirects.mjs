/**
 * Legacy root paths from the pre-/article/ site (email links, old CMS URLs).
 * Remove entries once traffic has moved to /article/[slug].
 */
export const LEGACY_ARTICLE_REDIRECTS = [
  {
    source: "/picklelaw",
    destination: "/article/yourpicklebounce",
    permanent: true,
  },
  {
    source: "/thepicklepriest",
    destination: "/article/blessyourpickle",
    permanent: true,
  },
  {
    source: "/pickleaddictsanonymous",
    destination: "/article/pickleaddictsanonymous",
    permanent: true,
  },
  {
    source: "/wheredopicklescomefrom",
    destination: "/article/daddywheredopicklescomesfrom",
    permanent: true,
  },
  {
    source: "/koolaidpickles",
    destination: "/article/koolaidpickles",
    permanent: true,
  },
  {
    source: "/picklewar",
    destination: "/article/nycpicklewar",
    permanent: true,
  },
  {
    source: "/picklerelatedcrimes",
    destination: "/article/picklerelatedcrimes",
    permanent: true,
  },
];
