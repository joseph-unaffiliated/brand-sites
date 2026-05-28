# Poll / trivia email links (The Pickle Report)

There is **no separate “poll slug”** in Sanity. The **article `slug`** (e.g. `biggestplayers` from the Google Doc **SLUG** line) identifies the issue for every vote link.

Option letters **a–d** are fixed by **order** in the **Options** list in Studio (1st = A, 2nd = B, 3rd = C, 4th = D). You do not enter link codes in the CMS.

## URL pattern (production)

**Recommended for email** (homepage redirect → `/poll`):

```
https://thepicklereport.com/?poll={letter}&issue={articleSlug}
```

Examples for issue `biggestplayers`:

| Option | Link |
|--------|------|
| A (1st in list) | `https://thepicklereport.com/?poll=a&issue=biggestplayers` |
| B | `https://thepicklereport.com/?poll=b&issue=biggestplayers` |
| C | `https://thepicklereport.com/?poll=c&issue=biggestplayers` |
| D | `https://thepicklereport.com/?poll=d&issue=biggestplayers` |

Middleware rewrites `poll` → `choice` on `/poll` and keeps `issue`.

**Direct** (also works):

```
https://thepicklereport.com/poll?issue={articleSlug}&choice={letter}
```

## Customer.io / email build

For each issue, set `issue` to that week’s article slug. Map buttons:

- Option 1 → `poll=a`
- Option 2 → `poll=b`
- Option 3 → `poll=c`
- Option 4 → `poll=d`

Trivia **correct answer** in Studio is still **Correct answer (optional)** (`a`–`d`) — match the yellow highlight in the Google Doc, not the link param.

## Web article

The on-site trivia block shows labels only (A. B. C. D. from order). Links are for **email**, not required on the article page.
