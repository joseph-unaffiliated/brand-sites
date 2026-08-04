# Amazon Associates

Unaffiliated participates in the **Amazon.com Associates** program.

| Item | Value |
|------|--------|
| Network / fallback tracking ID | `unaffiliate0f-20` |
| Env override | `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` |
| Shared package | `@publication-websites/affiliate` |
| Disclosure route | `/affiliate-disclosure` (every marketing app) |

## Per-brand tracking IDs

| Brand (site) | Tracking ID |
|--------------|-------------|
| The '90s Parent | `the90sparent-20` |
| The Pickle Report | `thepicklereport-20` |
| Hard Resets | `hardresets-20` |
| The Eyeballer's Cookbook | `theeyeballerscookbook-20` |
| Hipspeak | `hipspeak-20` |
| From the Vault (heebnewsletters) | `fromthevault-20` |
| Hookup Lists | `unaffiliate0f-20` (no dedicated ID yet) |
| The Kiss and Tell | `unaffiliate0f-20` (no dedicated ID yet) |
| Parenting Weakly | `parentingweakly-20` (no brand-sites app yet) |
| Jewish Fiction | `jewishfiction-20` (no brand-sites app yet) |

Defaults live in each `apps/<brand>/src/config/site.js`. Override per Vercel project with `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` if needed.

## What the sites do

1. **Tag Amazon product URLs** in Portable Text, list links, and house/commerce ad clicks (`withAmazonTag` / `affiliateAnchorProps`). Existing `tag=` values and short links (`amzn.to`, `a.co`) are left alone.
2. **Mark affiliate anchors** with `rel="sponsored noopener noreferrer"`.
3. **Disclose** via footer → Affiliate Disclosure and the dedicated disclosure page (FTC + Amazon wording).

## Editorial / Commerce Ads workflow

1. Paste a normal Amazon product URL into Sanity (or SiteStripe already-tagged URL), or set **Commerce URL** on an Airtable Commerce Ad.
2. The site appends that brand’s `tag=` at render time when missing.
3. Prefer **amazon.com** links for this US Associates account.

## Emails (Customer.io)

Not auto-tagged by the sites. Use the brand’s tracking ID in the URL (or SiteStripe) and include the Amazon Associate disclosure in the email body or footer.

## Approval clock

Amazon reviews the account after qualifying sales. Without qualifying referrals within **180 days** of application, access can be withdrawn.
