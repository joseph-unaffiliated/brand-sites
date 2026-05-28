#!/usr/bin/env python3
"""Emit JSON payload for syncing or creating Pickle Report issue documents in Sanity."""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDIO = ROOT / "studio-the-pickle-report"
MANIFEST = STUDIO / "canvas-imports" / "issues-manifest.json"
SANITY_ARTICLES = STUDIO / "canvas-imports" / "sanity-articles.json"
SOURCE = STUDIO / "canvas-imports" / "source"

FOOTER_RE = re.compile(
    r"(?i)(results will be shared|were you forwarded|add the pickle report|"
    r"33 bloor st|terms of use|privacy policy|unsubscribe|snooze for|"
    r"sexy pic\(kle\) of the week|today'?s poll|pickle trivia|"
    r"^photo by .+$|^\d+\s*$)"
)


def load_merge_module():
    spec = importlib.util.spec_from_file_location(
        "merge_pickle", ROOT / "scripts" / "merge-pickle-issue-into-template-docx.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def parse_csv_date(s: str) -> str:
    s = s.strip().strip('"')
    for fmt in ("%B %d, %Y", "%B %d %Y"):
        try:
            return datetime.strptime(s, fmt).strftime("%Y-%m-%dT12:00:00.000Z")
        except ValueError:
            continue
    return datetime.utcnow().strftime("%Y-%m-%dT12:00:00.000Z")


def issue_row(manifest: dict, issue_num: int) -> dict:
    for row in manifest.get("issues", []):
        if row.get("issue") == issue_num:
            return row
    raise SystemExit(f"Issue {issue_num} not in manifest")


def draft_row(sanity: dict, issue_num: int) -> dict | None:
    for row in sanity.get("drafts", []):
        if row.get("manifestIssue") == issue_num:
            return row
    for row in sanity.get("published", []):
        if row.get("manifestIssue") == issue_num:
            return row
    return None


def email_path_for_issue(
    m: object, issue_num: int, manifest_row: dict, all_issues: list[dict]
) -> Path | None:
    emails = m.discover_email_html_files(SOURCE)
    matched = m.match_emails_to_issues(emails, all_issues)
    path = matched.get(issue_num)
    if not path:
        return None
    er = m.parse_email_html(path)
    target = manifest_row.get("fullName", "")
    headline = er.get("headline") or ""
    if m.title_similarity(headline, target) < 0.42:
        return None
    return path


def filter_prose(paragraphs: list[str], dek: str) -> list[str]:
    out: list[str] = []
    dek_norm = dek.strip().lower() if dek else ""
    for p in paragraphs:
        t = p.strip()
        if not t or len(t) < 20:
            continue
        if FOOTER_RE.search(t):
            continue
        if dek_norm and t.lower() == dek_norm:
            continue
        if dek_norm and t.lower().startswith(dek_norm[:40]):
            continue
        out.append(t)
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--issue", type=int, required=True)
    args = parser.parse_args()

    m = load_merge_module()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    sanity = json.loads(SANITY_ARTICLES.read_text(encoding="utf-8"))
    row = issue_row(manifest, args.issue)
    draft = draft_row(sanity, args.issue)
    slug = row["slug"]
    draft_id = (
        draft["_id"]
        if draft
        else f"drafts.article.{slug}"
    )
    old_slug = draft["slug"] if draft else slug

    docx_name = row.get("sourceFile")
    docx_path = SOURCE / docx_name if docx_name else None
    all_issues = manifest.get("issues", [])
    email_path = email_path_for_issue(m, args.issue, row, all_issues)

    docx_c = m.empty_content()
    tier = "empty"
    if docx_path and docx_path.is_file():
        docx_c, tier = m.extract_content(docx_path)

    email_c = m.empty_content()
    if email_path:
        email_c = m.email_data_to_content(m.parse_email_html(email_path), m.ET.Element(f"{m.W}p"))

    # Re-parse email to dict (not ET) for JSON export
    email_raw = m.parse_email_html(email_path) if email_path else {}

    merged = m.merge_content_layers(docx_c, email_c) if email_path else docx_c

    headline = row.get("fullName") or ""
    if email_path:
        headline = email_raw.get("headline") or headline
    elif merged.get("headline"):
        headline = " ".join(m.paragraph_text(p, {}) for p in merged["headline"]).strip() or headline
    dek = (email_raw.get("dek") or "").strip()
    if not dek and draft:
        dek = (draft.get("subtitle") or "").strip()
    if not dek and merged.get("dek"):
        dek = " ".join(m.paragraph_text(p, {}) for p in merged["dek"]).strip()
    prose = filter_prose(email_raw.get("prose_paragraphs") or [], dek)
    if not prose:
        prose = [
            m.paragraph_text(p, {})
            for p in merged.get("prose", [])
            if m.paragraph_text(p, {})
        ]
        prose = filter_prose(prose, dek)

    main_image_url = email_raw.get("main_image_url") or ""
    if not main_image_url and merged.get("main_image_external_url"):
        main_image_url = merged.get("main_image_external_url") or ""

    payload = {
        "issue": args.issue,
        "draftId": draft_id,
        "existsInSanity": draft is not None,
        "oldSlug": old_slug,
        "slug": slug,
        "title": email_raw.get("headline") or headline,
        "subtitle": dek,
        "publishedDate": parse_csv_date(row.get("releaseDate", "")),
        "authorName": "Rachel Manson",
        "tier": tier,
        "proseParagraphs": prose,
        "nibbles": email_raw.get("nibbles") or merged.get("nibbles") or [],
        "pickleEconomics": {
            "heading": email_raw.get("pe_heading") or "",
            "paragraphs": email_raw.get("pe_paragraphs") or [],
            "imageUrl": email_raw.get("pe_image_url") or "",
        },
        "sexyPic": {
            "imageUrl": email_raw.get("sexy_image_url") or "",
            "credit": email_raw.get("sexy_credit") or "",
        },
        "trivia": {
            "question": email_raw.get("today_question") or "",
            "options": [
                {"letter": L, "label": lab}
                for L, lab in email_raw.get("today_options", [])
            ],
            "lastQuestion": email_raw.get("last_question") or "",
        },
        "mainImageUrl": main_image_url,
        "mainImageCredit": email_raw.get("main_image_credit") or "",
        "emailHtml": str(email_path) if email_path else None,
        "docxSource": docx_name,
    }
    print(json.dumps(payload, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
