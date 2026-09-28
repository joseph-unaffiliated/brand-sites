# Network parity audit (TPR, TNP, HR, TEC, HIP, FTV)

Snapshot of what each live or launching Next.js publication has, taken 2026-09-28 during the Hipspeak go-live / From the Vault readiness project. Re-run the checks when a brand launches or a shared pattern changes, and update this file with [`LAUNCH_PLAYBOOK.md`](./LAUNCH_PLAYBOOK.md).

| Code | App | Status |
|------|-----|--------|
| TPR | `apps/thepicklereport` | Live, `www.thepicklereport.com` |
| TNP | `apps/the90sparent` | Live |
| HR | `apps/hardresets` | Live, `www.hardresets.com` |
| TEC | `apps/theeyeballerscookbook` | Live, `www.theeyeballerscookbook.com` |
| HIP | `apps/hipspeak` | Ready on `hipspeak.vercel.app`; DNS cutover pending (`www.hipspeak.com` canonical) |
| FTV | `apps/heebnewsletters` | Staging on `heebnewsletters.vercel.app` (noindex); production host undecided |

Legend: ✅ in place · ⏳ planned (see note) · — intentionally absent (see accepted differences)

## Capability matrix

| Capability | TPR | TNP | HR | TEC | HIP | FTV |
|------------|-----|-----|----|-----|-----|-----|
| Content path | `/article` | `/article` | `/article` | `/recipe` | `/word` (308 from `/article`) | `/article` |
| Archive / browse | ✅ search | ✅ search | ✅ search | ✅ `/recipes` | ✅ `/archive` | ✅ search |
| Subscribe → magic `/execute` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Already-subscribed sign-in toast + `/sign-in` | ✅ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `/redirect` (magic external links) | ⏳ | ✅ local | ✅ local | ⏳ | ⏳ | ⏳ |
| Profile via Bearer token (magic) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reader events / profile v2 flags | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Airtable house-ad pool (`/api/house-ads`) | ✅ | ✅ | ✅ | ✅ | ✅ | ⏳ static cross-promo only |
| Subscribe-gated sticky (CTA vs ad) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sticky ad refresh cycle (45s, then 30s) | ✅ | ✅ | ✅ | ✅ | ⏳ | ⏳ |
| Comps pages (`/opted-out-comps`, `/opted-in-comps`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Magic branded comps confirmation | ✅ | ✅ | ✅ | ✅ | ⏳ magic push | ⏳ magic push |
| `/ai-policy` + footer link | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Polls (`/?poll=` → results) | ✅ | ✅ | ✅ | — | ✅ Pop Quiz | — |
| Favorites (subscription-gated, synced, email `?add=`) | — | — | — | ✅ `/favorites` | ✅ `/my-words` | — |
| Quiz (`/quiz`, gate → score) | — | — | — | — | ✅ | — |
| Giveaways | ✅ | — | — | — | — | — |
| Submissions | ✅ | ✅ | ✅ | ✅ | — | — |
| Rabbit Hole + podcast promo | — | — | — | — | — | ✅ |
| Own OneTrust domain script | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GTM + Meta pixel | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Own GA4 property | ✅ | ✅ | ✅ | ✅ | ⏳ ID needed | ⏳ ID needed |
| `isJewishContent` on article view tracking | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Magic `READERS_CORS_ORIGINS` | ✅ | ✅ | ✅ | ✅ (fixed 2026-09-28) | ✅ | ✅ |
| Hosted Sanity studio | | | | | ✅ `hipspeak.sanity.studio` | ✅ `fromthevault.sanity.studio` |
| Staging noindex flag (`NEXT_PUBLIC_NOINDEX`) | | | | | | ✅ on until go-live |

Notes on the ⏳ rows:

- **Sign-in toast, `/sign-in`, `/redirect`, house-ad stack, sticky refresh:** these move into `packages/magic-client` and `packages/shared-ads` after the TPR giveaway draw on 2026-10-06. Any `packages/*` change redeploys TPR through `turbo-ignore`, so nothing shared ships before then. FTV adopts the shared house-ad pool at the same time.
- **Branded comps confirmation:** `hipspeak` and `heebnewsletters` are in `BRANDED_COMPS_CONFIRMATION` locally in `subscription-functions`. They ship with the post-Oct 6 magic push.

## Accepted differences

These are deliberate. Don't count them as gaps.

- **No submissions on HIP or FTV.** No `SubmissionsCopyLink`, footer link, or About-page submissions copy.
- **The quiz is HIP-only** and stays app-local (not a shared package).
- **Favorites exist only on TEC and HIP**, because both are reference/utility sites. Both require a subscription to save.
- **TEC and FTV have no polls.** FTV passes `createHomeQueryMiddleware({ poll: null })`, so `/?poll=` stays on the homepage instead of 404ing.
- **Giveaways are TPR-only.**
- **FTV's Rabbit Hole and podcast promo** are FTV-only.
- **`/dev/mark-subscribed`** exists on every app. It is noindexed and disallowed in `robots.txt`, and is a QA helper, not a gap.

## Open items before each launch

**Hipspeak (DNS cutover):** GA4 measurement ID; you run the Cloudflare checklist and paste the Airtable Click URL formula from [`HIPSPEAK_VERCEL_ENV.md`](./HIPSPEAK_VERCEL_ENV.md); the post-Oct 6 shared-package and magic pushes; smoke tests.

**From the Vault (production):** choose the host; GA4 measurement ID; post-Oct 6 shared-package and magic pushes; import newer sent issues (and missing #28) from supplied HTML; then the cutover steps in [`HEEBNEWSLETTERS_VERCEL_ENV.md`](./HEEBNEWSLETTERS_VERCEL_ENV.md).

## Follow-ups (post-launch)

- Import newer Hipspeak issues from sent Customer.io newsletters into Sanity.
- Add a "Save this word" (`/my-words?add={slug}`) link to the Hipspeak email template.
- Move Hipspeak quiz questions from `data/slangQuiz.js` into Sanity.
- Check that no TEC subscriptions or favorites were lost while magic CORS was misconfigured (audit done; backfill awaits approval).
