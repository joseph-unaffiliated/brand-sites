# Amazon Associates

Unaffiliated participates in the **Amazon.com Associates** program.

| Item | Value |
|------|--------|
| Default tracking ID | `unaffiliate0f-20` |
| Env override | `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` |
| Shared package | `@publication-websites/affiliate` |
| Disclosure route | `/affiliate-disclosure` (every marketing app) |

## What the sites do

1. **Tag Amazon product URLs** in Portable Text and list links (`withAmazonTag` / `affiliateAnchorProps`). Existing `tag=` values and short links (`amzn.to`, `a.co`) are left alone.
2. **Mark affiliate anchors** with `rel="sponsored noopener noreferrer"`.
3. **Disclose** via footer → Affiliate and the dedicated disclosure page (FTC + Amazon wording).

## Per-brand tracking (optional)

In Associates Central → **Account settings** → **Tracking IDs**, create IDs like `picklereport-20`, then set `NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` on that brand’s Vercel marketing project. Until then, all brands share `unaffiliate0f-20`.

## Editorial workflow

1. Paste a normal Amazon product URL into Sanity (or SiteStripe already-tagged URL).
2. The site appends `tag=` at render time when missing.
3. Keep the disclosure page published; near-link “As an Amazon Associate…” is covered sitewide on `/affiliate-disclosure` and in footer.

## Emails (Customer.io)

Not wired in this repo. For newsletters: use tagged links (SiteStripe or `tag=unaffiliate0f-20`) and include the Amazon Associate disclosure sentence in the email body or footer. Do that when you start sending Amazon links by email.

## Approval clock

Amazon reviews the account after qualifying sales. Without qualifying referrals within **180 days** of application, access can be withdrawn.
