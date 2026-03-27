/**
 * Network newsletters/brands for profile "Discover more" and "Your subscriptions".
 * id must match BigQuery subscriptions keys (brand slugs).
 * signupUrl is the magic-link base (we append ?email= when user is subscribed).
 * displayName: optional; used in Discover more when different from name.
 */
export const networkBrands = [
  { id: "hookuplists", name: "Hookup Lists", signupUrl: "https://magic.hookuplists.com/" },
  { id: "thepicklereport", name: "The Pickle Report", signupUrl: "https://magic.thepicklereport.com/" },
  { id: "themixedhome", name: "The Mixed Home", signupUrl: "https://magic.themixedhome.com/" },
  { id: "zitsandcake", name: "Zits and Cake", signupUrl: "https://magic.zitsandcake.com/" },
  { id: "the90sparent", name: "The '90s Parent", signupUrl: "https://magic.the90sparent.com/" },
  { id: "obscuremixtape", name: "Obscure Mixtape", signupUrl: "https://magic.obscuremixtape.com/", preSubscribeLabel: "Pre-subscribe (coming Summer 2026)" },
  { id: "toddlercinema", name: "Toddler Cinema", signupUrl: "https://magic.toddlercinema.com/", preSubscribeLabel: "Pre-subscribe (coming in 2027)" },
  { id: "thequirkiest", name: "The Quirkiest", signupUrl: "https://magic.thequirkiest.com/" },
  { id: "theproudparent", name: "The Proud Parent", signupUrl: "https://magic.theproudparent.com/" },
  { id: "thepackandplay", name: "The Pack and Play", signupUrl: "https://magic.thepackandplay.com/", preSubscribeLabel: "Pre-subscribe (coming Fall 2026)" },
  { id: "thedadsdad", name: "The Dad's Dad", signupUrl: "https://magic.thedadsdad.com/" },
  { id: "thecomingofageparty", name: "The Coming of Age Party", signupUrl: "https://magic.thecomingofageparty.com/" },
  { id: "theeyeballerscookbook", name: "The Eyeballer's Cookbook", signupUrl: "https://magic.theeyeballerscookbook.com/", preSubscribeLabel: "Pre-subscribe (coming Summer 2026)" },
  { id: "thestewardprize", name: "The Steward Prize", signupUrl: "https://magic.thestewardprize.com/", preSubscribeLabel: "Pre-subscribe (coming in 2027)" },
  { id: "onetimeatcamp", name: "One Time at Camp", signupUrl: "https://magic.onetimeatcamp.com/", preSubscribeLabel: "Pre-subscribe (coming in 2027)" },
  { id: "millennialvsgenz", name: "Millennial vs Gen Z", signupUrl: "https://magic.millennialvsgenz.com/" },
  { id: "grapejuiceandnostalgia", name: "Grape Juice and Nostalgia", signupUrl: "https://magic.grapejuiceandnostalgia.com/" },
  { id: "hardresets", name: "Hard Resets", signupUrl: "https://magic.hardresets.com/", preSubscribeLabel: "Pre-subscribe (coming Spring 2026)" },
  { id: "highdiaries", name: "High Diaries", signupUrl: "https://magic.highdiaries.com/", preSubscribeLabel: "Pre-subscribe (coming in 2027)" },
  { id: "hipspeak", name: "Hipspeak", signupUrl: "https://magic.hipspeak.com/", preSubscribeLabel: "Pre-subscribe (coming Fall 2026)" },
  { id: "batmitzvahhorrorstories", name: "Bat Mitzvah Horror Stories", signupUrl: "https://magic.batmitzvahhorrorstories.com/", preSubscribeLabel: "Pre-subscribe (coming in 2027)" },
  { id: "heebnewsletters", name: "Heeb Newsletters", displayName: "From the Vault, by Heeb", signupUrl: "https://magic.heebnewsletters.com/" },
  { id: "jewishfiction", name: "Jewish Fiction", signupUrl: "https://magic.jewishfiction.com/", preSubscribeLabel: "Pre-subscribe (coming Spring 2026)" },
];

/** Discover more: brands that show a "Subscribe" link (live signup). */
export const discoverMoreSubscribeIds = [
  "thepicklereport",
  "the90sparent",
  "heebnewsletters",
];

/** Discover more: brands that show "Pre-subscribe" (link works, label shows coming-soon). */
export const discoverMorePreSubscribeIds = [
  "hardresets",
  "jewishfiction",
  "theeyeballerscookbook",
  "obscuremixtape",
  "hipspeak",
  "thepackandplay",
  "thestewardprize",
  "onetimeatcamp",
  "highdiaries",
  "batmitzvahhorrorstories",
  "toddlercinema",
];
