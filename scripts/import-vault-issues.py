#!/usr/bin/env python3
"""
Import sent From the Vault emails into Sanity (project m4gmd2lf) as `vaultIssue` documents.

Step 1 exports the email HTML from Customer.io:
    CUSTOMER_IO_APP_API_KEY=… node scripts/fetch-hipspeak-issues.mjs --brand=FTV --out=issues/fromthevault

Step 2 (this script) parses those files and reports what it would create:
    python3 scripts/import-vault-issues.py                      # dry run (default): parse + compare to Sanity
    python3 scripts/import-vault-issues.py --issue=32 --inspect # dump one parsed issue as JSON
    SANITY_API_TOKEN=… python3 scripts/import-vault-issues.py --write            # upload images, write drafts
    SANITY_API_TOKEN=… python3 scripts/import-vault-issues.py --write --publish  # write published docs

Documents use a stable id (`vaultIssue-<slug>`). Issues whose slug already exists in Sanity are
skipped unless you pass --replace, so editor changes made in Studio are never overwritten by accident.
`publishedDate` is the Customer.io send time from issues-catalog.json.

The parser keys on the inline styles of the Customer.io FTV template (Georgia 40-48px headline,
13px byline, 11px "Originally published" line, "Rabbit Hole (Curated)" section). If a template
change breaks a field, run --inspect and adjust the matching helper below.

Requires: beautifulsoup4 (`pip3 install beautifulsoup4`).
"""

import argparse
import json
import mimetypes
import os
import re
import sys
import urllib.parse
import urllib.request
from html import unescape
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DIR = REPO_ROOT / "issues" / "fromthevault"
PROJECT_ID = "m4gmd2lf"
DATASET = "production"
API_VERSION = "v2024-01-01"
CDN = "customeriomail.com"

BOILERPLATE_IMAGE_MARKERS = (
    "MikSignature", "FTV%20Logo", "/Mark_", "GUILD", "THE%20GUILD",
    "Heeb%20Retro%20Logo", "subscribe%20to%20the%20shows",
    "otter_01KHYDBC", "secularinsights-wordmark",
    "eeeeeee_01KGFGYWF3TV9XQRATC065H005", "01KQFQX3VJKSXWJKG7Y4XK1GDQ",
    "01KNMXJWX2NBF8FJP1JTYCCM9M",
)

CREW_LABELS = (
    r"(?:Styling|Design(?:s)?|Model(?:s)?|Hair(?:styling)?|Makeup|Cast(?:ing)?|Director|"
    r"Production Design|Caterer|Photographer|Special Effects|Best Boy|Props)"
)


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def clean(s):
    if s is None:
        return ""
    s = unescape(str(s)).replace("\xa0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    return s.strip()


def slugify(s):
    s = s.lower()
    s = re.sub(r"[\u2019'\"]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def style_of(el):
    return el.get("style") or ""


def is_boilerplate_image(src):
    return CDN not in src or any(m in src for m in BOILERPLATE_IMAGE_MARKERS)


def paragraph_to_block(p, key_prefix):
    spans = []
    counter = [0]

    def walk(node, marks):
        if isinstance(node, NavigableString):
            if clean(str(node)):
                counter[0] += 1
                spans.append({"_type": "span", "_key": f"{key_prefix}s{counter[0]}", "text": str(node), "marks": list(marks)})
            return
        if not isinstance(node, Tag):
            return
        if node.name == "br":
            counter[0] += 1
            spans.append({"_type": "span", "_key": f"{key_prefix}s{counter[0]}", "text": "\n", "marks": list(marks)})
            return
        extra = ["strong"] if node.name in ("strong", "b") else ["em"] if node.name in ("em", "i") else []
        for child in node.children:
            walk(child, marks + extra)

    for child in p.children:
        walk(child, [])

    cleaned = []
    for s in spans:
        txt = re.sub(r"[ \t]+", " ", s["text"].replace("\xa0", " "))
        if txt:
            cleaned.append({**s, "text": txt})
    if not cleaned:
        return None
    cleaned[0]["text"] = cleaned[0]["text"].lstrip()
    cleaned[-1]["text"] = cleaned[-1]["text"].rstrip()
    cleaned = [c for c in cleaned if c["text"]]
    if not cleaned or not "".join(c["text"] for c in cleaned).strip():
        return None
    return {"_type": "block", "_key": f"{key_prefix}b", "style": "normal", "markDefs": [], "children": cleaned}


def get_byline_info(soup):
    """The 'By X' paragraph (13px / weight 500 / margin 4px) under the headline."""
    for p in soup.find_all("p"):
        st = style_of(p)
        if "font-size: 13px" in st and "font-weight: 500" in st and "margin: 4px" in st:
            full_text = clean(p.get_text(" ", strip=True))
            if not full_text:
                continue
            # Crew-credit blocks (all-caps role labels, no real byline)
            if len(re.findall(r"\b[A-Z]{4,}\b", full_text)) >= 3:
                return None, None, p
            author = photographer = None
            m_by = re.match(r"^By:?\s+(.+?)(?:\s+(?:Photo|Image|Styling|Design)s?\s+by\b.*)?$", full_text, re.I)
            m_interview = re.match(r"^(?:Interview|Text)\s+by\s+(.+?)(?:\s+(?:Photo|Image)s?\s+by\b.*)?$", full_text, re.I)
            m_photo = re.search(
                r"(?:Photos?|Photography|Photographs?|Images?)\s+by\s+(.+?)(?=\s+" + CREW_LABELS + r"\s+by\b|$)",
                full_text, re.I,
            )
            if m_by:
                author = clean(m_by.group(1))
            elif m_interview:
                author = clean(m_interview.group(1))
            if m_photo:
                photographer = clean(m_photo.group(1))
            if author is None and photographer is None and not re.search(r"\bby\b", full_text, re.I):
                author = full_text if len(full_text) <= 60 else None
            return author, photographer, p
    return None, None, None


def get_original_pub_info(soup, byline_p):
    """The small paragraph (11px / weight 300 / margin 4px) after the byline with the HEEB citation."""
    candidates = byline_p.find_all_next("p") if byline_p is not None else soup.find_all("p")
    for p in candidates:
        st = style_of(p)
        if "font-size: 11px" in st and "font-weight: 300" in st and "margin: 4px" in st:
            full_text = re.sub(r"(?<=\d)\s+(?=\d)", "", clean(p.get_text(" ", strip=True)))
            m = re.search(r"(HEEB\s*#?\d+[^.]*)", full_text, re.I)
            pub_text = clean(m.group(1)).rstrip(". ") if m else None
            a = p.find("a")
            href = None
            if a and a.get("href") and clean(a.get_text()):
                href = re.sub(r"\?utm_source=unaffiliated$", "", unescape(a.get("href")))
            return href, pub_text, p
    return None, None, None


def get_era_label(soup):
    for p in soup.find_all("p"):
        st = style_of(p)
        if "font-weight: 500" in st and "text-align: center" in st and "margin: 0px" in st:
            m = re.match(r"^From (\d{4})$", clean(p.get_text()))
            if m:
                return m.group(0), int(m.group(1)), p
    return None, None, None


def is_headline(el):
    st = style_of(el)
    return el.name == "h2" and "Georgia" in st and re.search(r"font-size: (4[0-8])px", st)


def get_headline(soup, era_p):
    """Georgia 40-48px h2 run right after the era pill, before the byline."""
    h2s = []
    if era_p is not None:
        collecting = False
        for el in soup.find_all(["h2", "p"]):
            if el is era_p:
                collecting = True
                continue
            if not collecting:
                continue
            if is_headline(el):
                h2s.append(el)
            elif el.name == "h2" or h2s:
                break
    if not h2s:
        seen = set()
        for h2 in soup.find_all("h2"):
            t = clean(h2.get_text())
            if is_headline(h2) and t not in seen:
                seen.add(t)
                h2s.append(h2)
    return re.sub(r"\s+", " ", " ".join(clean(h.get_text(" ", strip=True)) for h in h2s)).strip()


def get_photo_credit(soup):
    """All-caps 'PHOTO …' / 'IMAGE …' credit line, usually right before the era pill."""
    for p in soup.find_all("p"):
        if "text-align: right" in style_of(p):
            t = re.sub(r"\s+", " ", clean(p.get_text(" ", strip=True)))
            if t and (t.isupper() or re.match(r"^(PHOTO|IMAGE)", t, re.I)):
                return t
    return None


def get_main_image(soup):
    for im in soup.find_all("img"):
        src = im.get("src") or ""
        if not is_boilerplate_image(src):
            return unescape(src)
    return None


def extract_body_and_rabbithole(soup, start_el):
    blocks = []
    counter = 0
    for el in (start_el.find_all_next(["p", "img", "h2"]) if start_el is not None else []):
        if el.name == "h2":
            if "Rabbit Hole" in clean(el.get_text()):
                break
            continue
        if el.name == "img":
            src = el.get("src") or ""
            if is_boilerplate_image(src):
                continue
            counter += 1
            blocks.append({"_type": "image_ref", "_key": f"img{counter}", "url": unescape(src)})
            continue
        txt = clean(el.get_text())
        if (
            not txt
            or txt == "---"
            or "text-align: center" in style_of(el)
            or txt.lower().startswith("originally published")
            or (re.match(r"^(this (piece|article)|the following)", txt, re.I) and "originally published" in txt.lower())
            or re.match(r"^From \d{4}$", txt)
        ):
            continue
        counter += 1
        block = paragraph_to_block(el, f"p{counter}")
        if block:
            blocks.append(block)

    rabbit_hole = []
    full_html = str(soup)
    rh_idx = full_html.find("Rabbit Hole (Curated)")
    if rh_idx != -1:
        rh_html = full_html[rh_idx:]
        stop = rh_html.find("Join our Guild")
        rh_soup = BeautifulSoup(rh_html[:stop] if stop != -1 else rh_html, "html.parser")
        for h2 in rh_soup.find_all("h2"):
            st = style_of(h2)
            if "font-size: 21px" not in st or "Georgia" not in st:
                continue
            title = clean(h2.get_text(" ", strip=True))
            if re.search(r"forwarded this email", title, re.I):
                continue
            a = h2.find_next("a")
            if not a:
                continue
            href = unescape(a.get("href") or "").split("?utm_source")[0]
            if "heebnewsletters.com" in href and "fromthevault" in href and "/article" not in href:
                continue
            if href and not any(r["url"] == href for r in rabbit_hole):
                rabbit_hole.append({"title": title, "url": href, "sourceLabel": clean(a.get_text(" ", strip=True))})
    return blocks, rabbit_hole


def parse_issue(html, fallback_slug):
    soup = BeautifulSoup(html, "html.parser")

    editor_intro = None
    for p in soup.find_all("p"):
        st = style_of(p)
        if "font-size: 15px" in st and "text-align: left" in st and "margin: 0px" in st:
            editor_intro = clean(p.get_text(" ", strip=True))
            break

    editor_name = editor_title = None
    for p in soup.find_all("p"):
        strong = p.find("strong")
        if strong and "Moore" in strong.get_text():
            editor_name = clean(strong.get_text())
            editor_title = clean(p.get_text(" ", strip=True)).replace(editor_name, "").lstrip(", ").strip()
            break

    era_label, original_year, era_p = get_era_label(soup)
    title = get_headline(soup, era_p)
    author_name, photographer_credit, byline_p = get_byline_info(soup)
    orig_url, orig_pub, pub_p = get_original_pub_info(soup, byline_p)
    year_m = re.search(r"(\d{4})\s*$", orig_pub or "")
    if year_m:
        original_year = int(year_m.group(1))

    body, rabbit_hole = extract_body_and_rabbithole(soup, pub_p if pub_p is not None else byline_p)

    issue_num_m = re.search(r"#(\d+)", orig_pub or "")
    if issue_num_m:
        buy_cta = f"Buy a copy of HEEB #{issue_num_m.group(1)} here to read the rest of the article."
    elif orig_url:
        buy_cta = "Buy a copy of the original issue here to read the rest of the article."
    else:
        buy_cta = None

    return {
        "title": title,
        "slug": slugify(title) if title else fallback_slug,
        "editorIntro": editor_intro,
        "editorName": editor_name,
        "editorTitle": editor_title,
        "mainImageUrl": get_main_image(soup),
        "eraLabel": era_label,
        "originalYear": original_year,
        "originalPublication": orig_pub,
        "originalIssueUrl": orig_url,
        "buyCtaLabel": buy_cta,
        "authorName": author_name,
        "photographerCredit": photographer_credit,
        "photoCredit": get_photo_credit(soup),
        "body": body,
        "rabbitHole": rabbit_hole,
    }


# ---------------------------------------------------------------------------
# Sanity
# ---------------------------------------------------------------------------

def sanity_request(path, *, token=None, data=None, content_type="application/json", host="api"):
    url = f"https://{PROJECT_ID}.{host}.sanity.io/{API_VERSION}/{path}"
    headers = {"Content-Type": content_type}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read())


def existing_slugs(token):
    query = urllib.parse.quote('*[_type == "vaultIssue"].slug.current')
    host = "api" if token else "apicdn"
    result = sanity_request(f"data/query/{DATASET}?query={query}", token=token, host=host)
    return {s for s in result.get("result", []) if s}


def upload_image(url, token, cache, cache_path):
    if url in cache:
        return cache[url]
    with urllib.request.urlopen(url, timeout=60) as res:
        data = res.read()
        content_type = res.headers.get_content_type() or mimetypes.guess_type(url)[0] or "image/jpeg"
    doc = sanity_request(f"assets/images/{DATASET}", token=token, data=data, content_type=content_type)["document"]
    cache[url] = doc["_id"]
    cache_path.write_text(json.dumps(cache, indent=2))
    return doc["_id"]


def build_document(parsed, published_date, asset_for, publish):
    body = []
    for b in parsed["body"]:
        if b["_type"] == "block":
            body.append(b)
            continue
        asset_id = asset_for(b["url"])
        if asset_id:
            body.append({"_type": "image", "_key": b["_key"], "asset": {"_type": "reference", "_ref": asset_id}})

    main_asset = asset_for(parsed["mainImageUrl"]) if parsed["mainImageUrl"] else None
    slug = parsed["slug"]
    doc = {
        "_id": f"{'' if publish else 'drafts.'}vaultIssue-{slug}",
        "_type": "vaultIssue",
        "newsletter": "from-the-vault",
        "title": parsed["title"],
        "slug": {"_type": "slug", "current": slug},
        "publishedDate": published_date,
        "editorIntro": parsed["editorIntro"],
        "editorName": parsed["editorName"] or "Mik Moore",
        "editorTitle": parsed["editorTitle"] or "President, Heeb Media",
        "eraLabel": parsed["eraLabel"],
        "originalYear": parsed["originalYear"],
        "originalPublication": parsed["originalPublication"],
        "originalIssueUrl": parsed["originalIssueUrl"],
        "buyCtaLabel": parsed["buyCtaLabel"],
        "authorName": parsed["authorName"],
        "photographerCredit": parsed["photographerCredit"],
        "photoCredit": parsed["photoCredit"],
        "mainImage": {"_type": "image", "asset": {"_type": "reference", "_ref": main_asset}} if main_asset else None,
        "body": body,
        "rabbitHole": [
            {"_key": f"rh{i}", "title": r["title"], "sourceLabel": r["sourceLabel"], "url": r["url"]}
            for i, r in enumerate(parsed["rabbitHole"], 1)
        ],
    }
    # Sanity rejects explicit nulls on optional fields less gracefully than omission.
    return {k: v for k, v in doc.items() if v is not None}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", default=str(DEFAULT_DIR), help="Folder written by fetch-hipspeak-issues.mjs --brand=FTV")
    ap.add_argument("--issue", type=int, help="Only this issue number")
    ap.add_argument("--inspect", action="store_true", help="Print parsed JSON for the selected issue(s)")
    ap.add_argument("--write", action="store_true", help="Upload images and write documents (needs SANITY_API_TOKEN)")
    ap.add_argument("--publish", action="store_true", help="Write published documents instead of drafts")
    ap.add_argument("--replace", action="store_true", help="Overwrite issues whose slug already exists")
    args = ap.parse_args()

    issues_dir = Path(args.dir)
    catalog_path = issues_dir / "issues-catalog.json"
    if not catalog_path.exists():
        sys.exit(f"No {catalog_path}. Run: node scripts/fetch-hipspeak-issues.mjs --brand=FTV --out={issues_dir}")
    rows = json.loads(catalog_path.read_text())["issues"]
    if args.issue is not None:
        rows = [r for r in rows if r["issue"] == args.issue]

    token = os.environ.get("SANITY_API_TOKEN")
    if args.write and not token:
        sys.exit("--write needs SANITY_API_TOKEN (an Editor token for project m4gmd2lf).")

    have = existing_slugs(token)
    print(f"Sanity has {len(have)} vaultIssue slug(s). Catalog has {len(rows)} issue(s).\n")

    cache_path = issues_dir / "image-asset-map.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    mutations, planned = [], []

    for row in rows:
        html_path = issues_dir / row["sourceHtml"]
        if not html_path.exists():
            print(f"#{row['issue']:>3} missing {html_path.name}, skipping")
            continue
        if not row.get("sentAt"):
            print(f"#{row['issue']:>3} {row['messageName']}: no send date, skipping")
            continue
        parsed = parse_issue(html_path.read_text(errors="replace"), f"issue-{row['issue']}")
        if args.inspect:
            print(json.dumps(parsed, indent=2, ensure_ascii=False))
            continue

        exists = parsed["slug"] in have
        action = "replace" if exists and args.replace else "skip (exists)" if exists else "create"
        paras = sum(1 for b in parsed["body"] if b["_type"] == "block")
        imgs = sum(1 for b in parsed["body"] if b["_type"] == "image_ref")
        warnings = [f for f in ("title", "editorIntro", "eraLabel", "mainImageUrl") if not parsed[f]]
        print(
            f"#{row['issue']:>3} {action:14} {parsed['slug']:45} sent={row['sentAt'][:10]} "
            f"paras={paras} imgs={imgs} rabbit={len(parsed['rabbitHole'])}"
            + (f"  MISSING: {', '.join(warnings)}" if warnings else "")
        )
        if action.startswith("skip"):
            continue
        planned.append((row, parsed))

    if args.inspect:
        return
    if not args.write:
        print(f"\nDry run: would write {len(planned)} {'published' if args.publish else 'draft'} document(s). Re-run with --write.")
        return

    for row, parsed in planned:
        def asset_for(url):
            try:
                return upload_image(url, token, cache, cache_path)
            except Exception as err:  # keep going; a missing image should not block the issue
                print(f"  image failed ({url[:80]}…): {err}")
                return None

        doc = build_document(parsed, row["sentAt"], asset_for, args.publish)
        mutations.append({"createOrReplace": doc})

    if mutations:
        result = sanity_request(
            f"data/mutate/{DATASET}", token=token, data=json.dumps({"mutations": mutations}).encode()
        )
        print(f"\nWrote {len(result.get('results', []))} document(s) ({'published' if args.publish else 'drafts'}).")


if __name__ == "__main__":
    main()
