#!/usr/bin/env python3
"""
Duplicate the Pickle Report Canvas template .docx and replace content slots with
an issue .docx, preserving template labels, spacing, and Word hyperlinks.

Usage:
  python3 scripts/merge-pickle-issue-into-template-docx.py \\
    --template "studio-the-pickle-report/canvas-templates/The Pickle Report - Google Doc Template.docx" \\
    --issue "studio-the-pickle-report/canvas-imports/source/The Pickle Report - Issue 20.docx" \\
    --output "studio-the-pickle-report/canvas-imports/output/areligiousloveofpickles.docx"
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import tempfile
import zipfile
from copy import deepcopy
from difflib import SequenceMatcher
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
PARA_SPACING_AFTER = "200"
ISSUE_DRIVE_LINK_RE = re.compile(r"^Issue \d+ ", re.I)
URL_RE = re.compile(r"https?://\S+", re.I)
LEGACY_SKIP_HEADERS = frozenset({"SPONSOR", "INTERACTIVE", "DID YOU KNOW", "LINKS"})
EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001FAFF\U00002700-\U000027BF\u2600-\u27BF\u2705]+|\ufe0f",
    re.UNICODE,
)

# Issue source labels (longest match first) -> extractor state / field
ISSUE_LABEL_RULES: list[tuple[str, str]] = [
    ("GRAPH INFORMATION URL", "pe_urls"),
    ("GRAPH INFORMATION SOURCE", "pe_credit"),
    ("GRAPH INFORMATION", "pe_graph_info"),
    ("GRAPH (LINK TO IMAGE IN PICKLE GRAPHS DRIVE)", "_graph_skip"),
    ("GRAPH", "_graph_skip"),
    ("SEXY PIC(KLE) OF THE WEEK IMAGE SOURCE", "sexy_credit"),
    ("SEXY PIC(KLE) OF THE WEEK (LINK TO IMAGE IN SEXY PIC(KLE) DRIVE)", "_sexy_skip"),
    ("SEXY PIC(KLE) OF THE WEEK", "_sexy_skip"),
    ("SEXY PIC", "_sexy_skip"),
    ("TODAY'S PICKLE TRIVIA", "_today_trivia"),
    ("LAST WEEK'S PICKLE TRIVIA", "_last_trivia"),
    ("NIBBLES (SECONDARY SOURCES)", "_nibbles_start"),
    ("NIBBLES", "_nibbles_start"),
    ("IMAGE (LINK TO IMAGE IN HEADER IMAGE DRIVE)", "_main_image_skip"),
    ("IMAGE", "_main_image_skip"),
    ("PHOTO SOURCE", "main_image_credit"),
    ("PICKLE ECONOMICS TITLE", "pe_title"),
    ("EMAIL PRE-HEADER", "email_preheader"),
    ("EMAIL SUBJECT LINE", "email_subject"),
    ("HEADLINE", "_headline_block"),
    ("ISSUE #", "issue_num"),
    ("BODY", "prose"),
    ("AUTHOR", "author"),
    ("SLUG", "slug"),
]


def normalize_label(text: str) -> str:
    t = text or ""
    t = t.replace("\u2019", "'").replace("\u2018", "'")
    t = re.sub(r"\s+", " ", t).strip().upper()
    # Only drop a trailing parenthetical note, not names like "PIC(KLE)".
    t = re.sub(r"\s*\([^)]+\)\s*$", "", t)
    return t


def match_issue_label(text: str) -> tuple[str, str] | None:
    n = normalize_label(text)
    if n.startswith("SOURCE "):
        return ("SOURCE", "_nibble")
    for prefix, field in ISSUE_LABEL_RULES:
        if n == prefix or n.startswith(prefix + " "):
            return (prefix, field)
    return None


def load_rels(z: zipfile.ZipFile) -> dict[str, str]:
    rels_root = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    return {
        rel.get("Id"): rel.get("Target")
        for rel in rels_root
        if rel.tag.endswith("Relationship")
    }


def paragraph_text(p: ET.Element, rels: dict[str, str]) -> str:
    parts: list[str] = []
    for node in p:
        if node.tag == f"{W}r":
            for t in node.findall(f"{W}t"):
                if t.text:
                    parts.append(t.text)
        elif node.tag == f"{W}hyperlink":
            parts.extend(t.text or "" for t in node.findall(f".//{W}t"))
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def paragraph_has_content(p: ET.Element, rels: dict[str, str]) -> bool:
    if paragraph_text(p, rels):
        return True
    return bool(p.findall(f".//{W}hyperlink"))


def is_template_label(text: str) -> str | None:
    n = normalize_label(text)
    exact = {
        "HEADLINE": "HEADLINE",
        "DEK": "DEK",
        "SLUG": "SLUG",
        "MAIN IMAGE CREDIT": "MAIN IMAGE CREDIT",
        "PUBLISHING DATE": "PUBLISHING DATE",
        "AUTHOR": "AUTHOR",
        "PROSE": "PROSE",
        "PICKLE ECONOMICS TITLE": "PICKLE ECONOMICS TITLE",
        "CREDIT / COURTESY LINE": "CREDIT / COURTESY LINE",
        "GRAPH INFORMATION URL": "GRAPH INFORMATION URL",
        "QUESTION": "QUESTION",
        "OPTION A": "OPTION A",
        "OPTION B": "OPTION B",
        "OPTION C": "OPTION C",
        "OPTION D": "OPTION D",
        "CORRECT ANSWER": "CORRECT ANSWER",
        "ISSUE #": "ISSUE #",
        "EMAIL SUBJECT LINE": "EMAIL SUBJECT LINE",
        "EMAIL PRE-HEADER": "EMAIL PRE-HEADER",
        "CREDIT": "CREDIT",
    }
    if n in exact:
        return exact[n]
    if n.startswith("MAIN IMAGE"):
        return "MAIN IMAGE"
    if n.startswith("ITEM "):
        return " ".join(text.strip().split()[:2])
    if "NIBBLES" in n:
        return "NIBBLES (secondary sources)"
    if "TODAY" in n and "TRIVIA" in n:
        return "TODAY'S PICKLE TRIVIA (answer highlighted in yellow)"
    if "LAST WEEK" in n and "TRIVIA" in n:
        return "LAST WEEK'S PICKLE TRIVIA (answer highlighted in yellow)"
    if n.startswith("SEXY PIC"):
        return "SEXY PIC(KLE) OF THE WEEK"
    return None


def clone_paragraph(p: ET.Element) -> ET.Element:
    return deepcopy(p)


def ensure_paragraph_spacing(p: ET.Element, after: str = PARA_SPACING_AFTER) -> None:
    """Match template spacing: w:after on every paragraph."""
    pPr = p.find(f"{W}pPr")
    if pPr is None:
        pPr = ET.SubElement(p, f"{W}pPr")
    spacing = pPr.find(f"{W}spacing")
    if spacing is None:
        spacing = ET.SubElement(pPr, f"{W}spacing")
    spacing.set(f"{W}after", after)
    spacing.set(f"{W}lineRule", "auto")


def relink_issue_hyperlinks(
    p: ET.Element,
    issue_rel_targets: dict[str, str],
    rel_files: dict[str, bytes],
) -> None:
    """Point hyperlinks cloned from the issue doc at the correct output relationships."""
    for h in p.findall(f".//{W}hyperlink"):
        rid = hyperlink_rel_id(h)
        target = issue_rel_targets.get(rid or "", "") if rid else ""
        if target:
            set_hyperlink_rel_id(h, ensure_hyperlink_target(rel_files, target))


def append_paragraph(
    out: list[ET.Element],
    p: ET.Element,
    *,
    issue_rel_targets: dict[str, str] | None = None,
    rel_files: dict[str, bytes] | None = None,
    from_issue: bool = False,
) -> None:
    if from_issue and issue_rel_targets and rel_files:
        relink_issue_hyperlinks(p, issue_rel_targets, rel_files)
    ensure_paragraph_spacing(p)
    out.append(p)


def hyperlink_text(h: ET.Element) -> str:
    return "".join(t.text or "" for t in h.findall(f".//{W}t"))


def hyperlink_rel_id(h: ET.Element) -> str | None:
    rid = h.get(R_ID)
    if rid:
        return rid
    for key, val in h.attrib.items():
        if key.endswith("}id"):
            return val
    return None


def set_hyperlink_rel_id(h: ET.Element, rid: str) -> None:
    """Update r:id in place so Word namespace prefixes stay valid on serialize."""
    for key in list(h.attrib):
        if key.endswith("}id"):
            h.attrib[key] = rid
            return
    # Never h.set(R_ID, …) on new elements — it serializes as ns2:="rIdN" and breaks Word.


def load_issue_rel_targets(issue_path: Path) -> dict[str, str]:
    with zipfile.ZipFile(issue_path) as z:
        rels_root = ET.fromstring(z.read("word/_rels/document.xml.rels"))
    return {
        rel.get("Id"): rel.get("Target")
        for rel in rels_root
        if rel.tag.endswith("Relationship")
    }


def ensure_hyperlink_target(
    files: dict[str, bytes],
    target: str,
) -> str:
    """Add an external hyperlink relationship to the output docx if needed; return its rId."""
    out_rels_path = "word/_rels/document.xml.rels"
    out_rels_root = ET.fromstring(files[out_rels_path])
    for rel in out_rels_root:
        if rel.tag.endswith("Relationship") and rel.get("Target") == target:
            return rel.get("Id") or ""

    max_num = 0
    for rel in out_rels_root:
        if not rel.tag.endswith("Relationship"):
            continue
        m = re.match(r"rId(\d+)", rel.get("Id") or "")
        if m:
            max_num = max(max_num, int(m.group(1)))
    new_rid = f"rId{max_num + 1}"
    ET.SubElement(
        out_rels_root,
        f"{{{REL_NS}}}Relationship",
        {
            "Id": new_rid,
            "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
            "Target": target,
            "TargetMode": "External",
        },
    )
    files[out_rels_path] = ET.tostring(out_rels_root, encoding="utf-8", xml_declaration=True)
    return new_rid


def find_template_drive_line(template_paras: list[ET.Element], rels: dict[str, str], prefix: str) -> ET.Element | None:
    for p in template_paras:
        t = paragraph_text(p, rels)
        if t.upper().startswith(prefix.upper()) and "/" in t and "ISSUE" in t.upper():
            return p
    return None


def replace_run_text(p: ET.Element, old: str, new: str) -> None:
    for t in p.findall(f".//{W}t"):
        if t.text and old in t.text:
            t.text = t.text.replace(old, new, 1)


def build_main_image_drive_line(
    template_paras: list[ET.Element],
    rels: dict[str, str],
    issue_link_p: ET.Element,
    issue_rel_targets: dict[str, str],
    template_rel_targets: dict[str, str],
    files: dict[str, bytes],
    label_p: ET.Element,
) -> ET.Element:
    """MAIN IMAGE (Issue N Header / All Header Images) — same shape as GRAPH/SEXY drive lines."""
    graph_line = find_template_drive_line(template_paras, rels, "GRAPH (")
    cp = clone_paragraph(graph_line if graph_line is not None else label_p)
    replace_run_text(cp, "GRAPH", "MAIN IMAGE")
    patch_template_issue_drive_link(cp, issue_link_p, issue_rel_targets, files)
    folder_target = ""
    for h in label_p.findall(f"{W}hyperlink"):
        if not ISSUE_DRIVE_LINK_RE.match(hyperlink_text(h)):
            rid = hyperlink_rel_id(h)
            folder_target = template_rel_targets.get(rid or "", "") if rid else ""
    for h in cp.findall(f"{W}hyperlink"):
        if not ISSUE_DRIVE_LINK_RE.match(hyperlink_text(h)):
            for t in h.findall(f".//{W}t"):
                t.text = "All Header Images"
            if folder_target:
                set_hyperlink_rel_id(h, ensure_hyperlink_target(files, folder_target))
    return cp


def url_from_issue_para(p: ET.Element, issue_rel_targets: dict[str, str]) -> str:
    for h in p.findall(f".//{W}hyperlink"):
        rid = hyperlink_rel_id(h)
        if rid and issue_rel_targets.get(rid):
            return issue_rel_targets[rid]
    return paragraph_text(p, {})


def build_pe_credit_paragraph(
    credit_p: ET.Element,
    url_paras: list[ET.Element],
    issue_rel_targets: dict[str, str],
    files: dict[str, bytes],
    style_p: ET.Element,
) -> ET.Element:
    """GRAPH INFORMATION SOURCE as comma-separated hyperlinks (one per GRAPH INFORMATION URL)."""
    names = [n.strip() for n in paragraph_text(credit_p, {}).split(",") if n.strip()]
    urls = [url_from_issue_para(p, issue_rel_targets) for p in url_paras]
    urls = [u for u in urls if u]
    if not names or not urls:
        return clone_paragraph(credit_p)

    p = ET.Element(f"{W}p")
    pPr = style_p.find(f"{W}pPr")
    if pPr is not None:
        p.append(deepcopy(pPr))

    def add_text(text: str) -> None:
        r = ET.SubElement(p, f"{W}r")
        ET.SubElement(r, f"{W}rPr")
        t = ET.SubElement(r, f"{W}t")
        t.text = text
        t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")

    sample_h = url_paras[0].find(f".//{W}hyperlink")
    if sample_h is None:
        return clone_paragraph(credit_p)

    def add_link(label: str, target: str) -> None:
        h = deepcopy(sample_h)
        for t in h.findall(f".//{W}t"):
            t.text = label
        new_rid = ensure_hyperlink_target(files, target)
        for key in h.attrib:
            if key.endswith("}id"):
                h.attrib[key] = new_rid
                break
        p.append(h)

    for idx, name in enumerate(names):
        if idx < len(urls):
            add_link(name, urls[idx])
        else:
            add_text(name)
        if idx < len(names) - 1:
            add_text(", ")
    ensure_paragraph_spacing(p)
    return p


def patch_template_issue_drive_link(
    template_p: ET.Element,
    issue_link_p: ET.Element,
    issue_rel_targets: dict[str, str],
    files: dict[str, bytes],
) -> None:
    """Replace 'Issue N Graph|Sexy|Header…' hyperlink in a template drive line with the issue's link."""
    issue_hy: ET.Element | None = None
    for h in issue_link_p.findall(f"{W}hyperlink"):
        if ISSUE_DRIVE_LINK_RE.match(hyperlink_text(h)):
            issue_hy = h
            break
    if issue_hy is None:
        return

    issue_text = hyperlink_text(issue_hy)
    issue_rid = hyperlink_rel_id(issue_hy)
    issue_target = issue_rel_targets.get(issue_rid or "", "") if issue_rid else ""

    for h in template_p.findall(f"{W}hyperlink"):
        if ISSUE_DRIVE_LINK_RE.match(hyperlink_text(h)):
            for t in h.findall(f".//{W}t"):
                t.text = issue_text
            if issue_target:
                new_rid = ensure_hyperlink_target(files, issue_target)
                set_hyperlink_rel_id(h, new_rid)
            return


def collect_hyperlink_rids(paras: list[ET.Element]) -> set[str]:
    rids: set[str] = set()
    for p in paras:
        for h in p.findall(f".//{W}hyperlink"):
            rid = hyperlink_rel_id(h)
            if rid:
                rids.add(rid)
    return rids


def merge_issue_relationships(
    files: dict[str, bytes],
    issue_path: Path,
    issue_rids: set[str],
) -> dict[str, str]:
    """Copy hyperlink relationships from the issue docx into the output; return old→new rId map."""
    if not issue_rids:
        return {}

    issue_rels_root = ET.fromstring(
        zipfile.ZipFile(issue_path).read("word/_rels/document.xml.rels")
    )
    issue_targets = {
        rel.get("Id"): rel.get("Target")
        for rel in issue_rels_root
        if rel.tag.endswith("Relationship")
    }

    out_rels_path = "word/_rels/document.xml.rels"
    out_rels_root = ET.fromstring(files[out_rels_path])
    existing_targets = {
        rel.get("Target"): rel.get("Id")
        for rel in out_rels_root
        if rel.tag.endswith("Relationship")
    }

    max_num = 0
    for rel in out_rels_root:
        if not rel.tag.endswith("Relationship"):
            continue
        rid = rel.get("Id") or ""
        m = re.match(r"rId(\d+)", rid)
        if m:
            max_num = max(max_num, int(m.group(1)))

    rid_map: dict[str, str] = {}
    for old_rid in sorted(issue_rids):
        target = issue_targets.get(old_rid)
        if not target:
            continue
        if target in existing_targets:
            rid_map[old_rid] = existing_targets[target]
            continue
        max_num += 1
        new_rid = f"rId{max_num}"
        ET.SubElement(
            out_rels_root,
            f"{{{REL_NS}}}Relationship",
            {
                "Id": new_rid,
                "Type": "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink",
                "Target": target,
                "TargetMode": "External",
            },
        )
        existing_targets[target] = new_rid
        rid_map[old_rid] = new_rid

    files[out_rels_path] = ET.tostring(out_rels_root, encoding="utf-8", xml_declaration=True)
    return rid_map


def remap_hyperlink_rids(paras: list[ET.Element], rid_map: dict[str, str]) -> None:
    if not rid_map:
        return
    for p in paras:
        for h in p.findall(f".//{W}hyperlink"):
            old = hyperlink_rel_id(h)
            if old and old in rid_map:
                set_hyperlink_rel_id(h, rid_map[old])


def strip_prefix_paragraph(p: ET.Element, prefix: str) -> ET.Element:
    """Clone paragraph and remove a leading 'Prefix:' from its text runs."""
    cp = clone_paragraph(p)
    prefix_re = re.compile(rf"^{re.escape(prefix)}\s*:?\s*", re.I)
    for t in cp.findall(f".//{W}t"):
        if t.text:
            t.text = prefix_re.sub("", t.text, count=1)
    return cp


def highlight_letter(p: ET.Element) -> str | None:
    for r in p.findall(f"{W}r"):
        rPr = r.find(f"{W}rPr")
        if rPr is None or rPr.find(f"{W}highlight") is None:
            continue
        t = r.find(f"{W}t")
        if t is not None and t.text:
            m = re.match(r"^([A-D]):\s*", t.text.strip())
            if m:
                return m.group(1)
    return None


def empty_content() -> dict:
    return {
        "slug": [],
        "issue_num": [],
        "email_subject": [],
        "email_preheader": [],
        "headline": [],
        "dek": [],
        "main_image_issue_link": [],
        "main_image_credit": [],
        "main_image_external_url": "",
        "publishing_date": [],
        "author": [],
        "prose": [],
        "pe_title": [],
        "pe_graph_info": [],
        "pe_credit": [],
        "pe_urls": [],
        "nibbles": [],
        "graph_issue_link": [],
        "sexy_issue_link": [],
        "sexy_credit": [],
        "today_trivia": {"question": [], "options": [], "correct_letter": ""},
        "last_trivia": {"question": [], "options": [], "correct_letter": ""},
    }


def strip_emoji(text: str) -> str:
    return EMOJI_RE.sub("", text or "").strip()


def split_label_value(text: str, label: str) -> str:
    m = re.match(rf"^{re.escape(label)}\s*:\s*(.*)$", text.strip(), re.I)
    if m:
        return m.group(1).strip()
    upper = text.upper()
    lab = label.upper()
    if upper.startswith(lab) and not upper.startswith(lab + ":"):
        return text[len(label) :].lstrip(": ").strip()
    return ""


def line_kind(text: str) -> str | None:
    raw = text.strip()
    t = strip_emoji(raw)
    tu = re.sub(r"\s+", " ", t).strip()
    tul = tu.upper()
    if re.match(r"^(HEADLINE|HED)\s*:", tul, re.I) or (
        tul.startswith("HEADLINE") and ":" in tu[:12]
    ):
        return "headline"
    if re.match(r"^DEK\s*:", tul, re.I) or (tul.startswith("DEK") and ":" in tu[:6]):
        return "dek"
    if re.match(r"^IMAGE\s*:", tul, re.I) or tul == "IMAGE":
        return "image"
    if tul.startswith("SOURCE:") or tul == "SOURCE":
        return "source"
    if "PICKLE ECONOMICS" in tul:
        return "pe"
    if tul.startswith("NIBBLES"):
        return "nibbles"
    if "SEXY PIC" in tul:
        return "sexy"
    if "TODAY" in tul and "TRIVIA" in tul:
        return "today_trivia"
    if "LAST WEEK" in tul and "TRIVIA" in tul:
        return "last_trivia"
    for skip in LEGACY_SKIP_HEADERS:
        if tul.startswith(skip):
            return "skip_legacy"
    if tul == "AD" or tul.startswith("AD "):
        return "skip_ad"
    if tul.startswith("(LEAVE BLANK"):
        return "skip_blank"
    if tul.startswith("WAITING ON"):
        return "skip_blank"
    return None


def make_url_paragraph(url: str, style_p: ET.Element) -> ET.Element:
    """Plain URL paragraph (hyperlink added during merge when rel_files is available)."""
    return make_text_paragraph(url, style_p)


def make_external_hyperlink_paragraph(
    url: str,
    style_p: ET.Element,
    rel_files: dict[str, bytes],
    label: str | None = None,
) -> ET.Element:
    sample_h = style_p.find(f".//{W}hyperlink")
    if sample_h is None:
        return make_text_paragraph(label or url, style_p)
    p = make_text_paragraph("", style_p)
    for r in list(p.findall(f"{W}r")):
        p.remove(r)
    h = deepcopy(sample_h)
    for t in h.findall(f".//{W}t"):
        t.text = label or url
    set_hyperlink_rel_id(h, ensure_hyperlink_target(rel_files, url))
    p.append(h)
    ensure_paragraph_spacing(p)
    return p


def load_doc_paragraphs(path: Path) -> tuple[list[ET.Element], dict[str, str]]:
    with zipfile.ZipFile(path) as z:
        rels = load_rels(z)
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f".//{W}body")
    return list(body.findall(f"{W}p")), rels


def detect_tier(path: Path) -> str:
    paras, rels = load_doc_paragraphs(path)
    has_slug = has_body = has_headline_colon = has_legacy = False
    for p in paras[:45]:
        text = paragraph_text(p, rels)
        if not text:
            continue
        n = normalize_label(text)
        if n == "SLUG" or text.strip().upper() == "SLUG":
            has_slug = True
        if n == "BODY" or re.match(r"^BODY\b", text.strip(), re.I):
            has_body = True
        if re.match(r"^(headline|hed)\s*:", text, re.I):
            has_headline_colon = True
        tul = strip_emoji(text).upper()
        for skip in LEGACY_SKIP_HEADERS:
            if tul.startswith(skip):
                has_legacy = True
    if has_slug and has_body:
        return "modern"
    if has_headline_colon:
        return "legacy" if has_legacy else "transitional"
    return "unknown"


def extract_legacy_or_transitional(path: Path) -> dict:
    paras, rels = load_doc_paragraphs(path)
    content = empty_content()
    style_p = paras[0] if paras else ET.Element(f"{W}p")

    state: str | None = None
    pending_label: str | None = None
    nibble: dict | None = None
    trivia_opts: list[str] = []
    i = 0

    def flush_trivia_options(target: dict) -> None:
        nonlocal trivia_opts
        if not trivia_opts:
            return
        letters = "ABCD"
        for idx, opt in enumerate(trivia_opts[:4]):
            target["options"].append((letters[idx], opt))
        trivia_opts = []

    while i < len(paras):
        p = paras[i]
        text = paragraph_text(p, rels)
        kind = line_kind(text) if text else None

        if state == "skip_legacy":
            if kind and kind not in ("skip_legacy",):
                state = None
            else:
                i += 1
                continue

        if kind == "skip_legacy":
            state = "skip_legacy"
            i += 1
            continue
        if kind in ("skip_ad", "skip_blank"):
            i += 1
            continue

        if kind == "headline":
            val = (
                split_label_value(text, "Headline")
                or split_label_value(text, "HEADLINE")
                or split_label_value(text, "Hed")
                or split_label_value(text, "HED")
            )
            if val:
                content["headline"] = [make_text_paragraph(val, p)]
            else:
                pending_label = "headline"
            state = None
            i += 1
            continue
        if kind == "dek":
            val = split_label_value(text, "Dek") or split_label_value(text, "DEK")
            if val:
                content["dek"] = [make_text_paragraph(val, p)]
            else:
                pending_label = "dek"
            state = None
            i += 1
            continue
        if kind == "image":
            val = split_label_value(text, "IMAGE")
            urls = URL_RE.findall(val or text)
            if urls:
                content["main_image_external_url"] = urls[0]
                content["main_image_issue_link"] = [make_url_paragraph(urls[0], p)]
            elif val:
                content["main_image_credit"] = [make_text_paragraph(val, p)]
            else:
                pending_label = "image"
            i += 1
            continue
        if kind == "source":
            val = split_label_value(text, "Source") or split_label_value(text, "SOURCE")
            urls = URL_RE.findall(val or text)
            if urls:
                content["main_image_external_url"] = urls[0]
                content["main_image_issue_link"] = [make_url_paragraph(urls[0], p)]
            if val and not urls:
                content["main_image_credit"] = [make_text_paragraph(val, p)]
            elif paragraph_has_content(p, rels) and not val and not urls:
                content["main_image_credit"] = [clone_paragraph(p)]
            i += 1
            continue
        if kind == "pe":
            title = strip_emoji(text)
            for prefix in ("💡", "Pickle Economics", "PICKLE ECONOMICS"):
                title = re.sub(re.escape(prefix), "", title, flags=re.I).strip(" :")
            if title and not title.upper().startswith("PICKLE ECONOMICS"):
                content["pe_title"] = [make_text_paragraph(title, p)]
            state = "pe"
            i += 1
            continue
        if kind == "nibbles":
            state = "nibbles"
            nibble = None
            i += 1
            continue
        if kind == "sexy":
            state = "sexy"
            i += 1
            continue
        if kind == "today_trivia":
            flush_trivia_options(content["last_trivia"])
            state = "today_trivia"
            q = strip_emoji(text)
            for prefix in ("Today's Pickle Trivia", "TODAY'S PICKLE TRIVIA", "✅"):
                q = re.sub(prefix, "", q, flags=re.I).strip(" :")
            if q and "?" in q:
                content["today_trivia"]["question"] = [make_text_paragraph(q, p)]
            trivia_opts = []
            i += 1
            continue
        if kind == "last_trivia":
            flush_trivia_options(content["today_trivia"])
            state = "last_trivia"
            trivia_opts = []
            i += 1
            continue

        if pending_label == "headline" and text:
            content["headline"] = [clone_paragraph(p)]
            pending_label = None
            i += 1
            continue
        if pending_label == "dek" and text:
            content["dek"] = [clone_paragraph(p)]
            pending_label = None
            i += 1
            continue
        if pending_label == "image" and text:
            urls = URL_RE.findall(text)
            if urls:
                content["main_image_external_url"] = urls[0]
                content["main_image_issue_link"] = [make_url_paragraph(urls[0], p)]
            pending_label = None
            i += 1
            continue
        pending_label = None

        if state == "pe":
            if text and ISSUE_DRIVE_LINK_RE.match(text):
                content["graph_issue_link"] = [clone_paragraph(p)]
            elif text and URL_RE.search(text):
                content["graph_issue_link"] = [clone_paragraph(p)]
            elif text and not text.lower().startswith("waiting"):
                if not content["pe_title"] and len(text) < 120:
                    content["pe_title"] = [make_text_paragraph(text, p)]
                elif "(leave blank" not in text.lower():
                    content["pe_graph_info"].append(clone_paragraph(p))
            i += 1
            continue

        if state == "nibbles":
            if not text:
                i += 1
                continue
            urls = URL_RE.findall(text)
            if urls:
                if nibble is None:
                    nibble = {"blurb": [], "cta": [], "url": []}
                    content["nibbles"].append(nibble)
                nibble["url"] = [make_url_paragraph(urls[0], p)]
                nibble = None
            else:
                nibble = {"blurb": [make_text_paragraph(text, p)], "cta": [], "url": []}
                content["nibbles"].append(nibble)
            i += 1
            continue

        if state == "sexy":
            if text and ISSUE_DRIVE_LINK_RE.match(text):
                content["sexy_issue_link"] = [clone_paragraph(p)]
            elif URL_RE.search(text):
                url = URL_RE.search(text).group(0)
                content["sexy_issue_link"] = [make_url_paragraph(url, p)]
            elif text and text.upper() != "AD":
                content["sexy_credit"] = [make_text_paragraph(text, p)]
            i += 1
            continue

        if state == "today_trivia":
            if re.match(r"^[A-D]\s*:", text, re.I):
                letter = text[0].upper()
                opt = text.split(":", 1)[-1].strip()
                content["today_trivia"]["options"].append((letter, opt))
                hl = highlight_letter(p)
                if hl:
                    content["today_trivia"]["correct_letter"] = hl
            elif text and "?" in text and not content["today_trivia"]["question"]:
                content["today_trivia"]["question"] = [make_text_paragraph(text, p)]
            elif text and len(text) > 10 and len(content["today_trivia"]["options"]) < 4:
                trivia_opts.append(text)
            i += 1
            continue

        if state == "last_trivia":
            if re.match(r"^[A-D]\s*:", text, re.I):
                letter = text[0].upper()
                opt = text.split(":", 1)[-1].strip()
                content["last_trivia"]["options"].append((letter, opt))
            elif text and "?" in text:
                content["last_trivia"]["question"] = [make_text_paragraph(text, p)]
            i += 1
            continue

        # Body prose (before optional sections)
        if state is None and kind is None and text and paragraph_has_content(p, rels):
            content["prose"].append(clone_paragraph(p))
        i += 1

    flush_trivia_options(content["today_trivia"])
    flush_trivia_options(content["last_trivia"])
    return content


def extract_content(path: Path) -> tuple[dict, str]:
    tier = detect_tier(path)
    if tier == "modern":
        return extract_issue_content(path), tier
    if tier in ("transitional", "legacy"):
        return extract_legacy_or_transitional(path), tier
    return empty_content(), tier


def apply_metadata_overlay(content: dict, meta: dict, style_p: ET.Element) -> None:
    if meta.get("slug"):
        content["slug"] = [make_text_paragraph(str(meta["slug"]), style_p)]
    if meta.get("releaseDate"):
        content["publishing_date"] = [make_text_paragraph(str(meta["releaseDate"]), style_p)]
    if meta.get("fullName") and not content.get("headline"):
        content["headline"] = [make_text_paragraph(str(meta["fullName"]), style_p)]


def normalize_match_title(text: str) -> str:
    t = strip_emoji(unescape(text or ""))
    t = re.sub(r"<[^>]+>", "", t)
    t = t.replace("\u201c", '"').replace("\u201d", '"').replace("\u2019", "'")
    t = re.sub(r"[^\w\s\"']", " ", t.lower())
    return re.sub(r"\s+", " ", t).strip()


def title_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize_match_title(a), normalize_match_title(b)).ratio()


def clean_html_text(fragment: str) -> str:
    t = unescape(re.sub(r"<br\s*/?>", "\n", fragment, flags=re.I))
    t = re.sub(r"<[^>]+>", "", t)
    t = t.replace("\xa0", " ").replace("\u2005", "").replace("\u200b", "")
    return re.sub(r"\s+", " ", t).strip()


class _EmailTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        t = data.strip()
        if t and t not in ("\u2005", "\u200b"):
            self.parts.append(t)


def html_to_text(html: str) -> str:
    p = _EmailTextExtractor()
    p.feed(html)
    return clean_html_text(" ".join(p.parts))


def extract_email_headline(html: str) -> str:
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.I | re.S)
    if m:
        return clean_html_text(m.group(1))
    m = re.search(
        r'class="cyqtndr"[^>]*>(.*?)</p>',
        html,
        re.I | re.S,
    )
    if m:
        return clean_html_text(m.group(1))
    return ""


def discover_email_html_files(source_dir: Path) -> list[Path]:
    paths: list[Path] = sorted(source_dir.glob("template-*.html"))
    for index in source_dir.rglob("index.html"):
        if index.parent != source_dir:
            paths.append(index)
    return paths


def match_emails_to_issues(
    email_paths: list[Path],
    manifest_issues: list[dict],
    *,
    min_score: float = 0.42,
) -> dict[int, Path]:
    """Map issue number -> email HTML by headline similarity (global best-first assignment)."""
    pairs: list[tuple[float, int, Path]] = []
    for entry in manifest_issues:
        issue_num = entry.get("issue")
        target = entry.get("fullName", "")
        if not issue_num or not target:
            continue
        for path in email_paths:
            html = path.read_text(encoding="utf-8", errors="replace")
            headline = extract_email_headline(html)
            score = title_similarity(headline, target)
            if score >= min_score:
                pairs.append((score, issue_num, path))
    pairs.sort(key=lambda x: x[0], reverse=True)
    matched: dict[int, Path] = {}
    used_issues: set[int] = set()
    used_paths: set[Path] = set()
    for score, issue_num, path in pairs:
        if issue_num in used_issues or path in used_paths:
            continue
        matched[issue_num] = path
        used_issues.add(issue_num)
        used_paths.add(path)
    return matched


def parse_email_html(path: Path) -> dict:
    html = path.read_text(encoding="utf-8", errors="replace")
    html = html.replace("\r\n", "\n")

    data: dict = {
        "headline": extract_email_headline(html),
        "dek": "",
        "prose_paragraphs": [],
        "main_image_url": "",
        "main_image_credit": "",
        "pe_heading": "",
        "pe_paragraphs": [],
        "pe_image_url": "",
        "nibbles": [],
        "sexy_image_url": "",
        "sexy_credit": "",
        "today_question": "",
        "today_options": [],
        "last_question": "",
        "last_options": [],
    }

    # Dek: centered subhead after h1 (before first hr block in article)
    dek_m = re.search(
        r"</h1>\s*(?:<div[^>]*>\s*)*<p[^>]*text-align:\s*center[^>]*>(.*?)</p>",
        html,
        re.I | re.S,
    )
    if not dek_m:
        dek_m = re.search(
            r'class="cyqtndr"[^>]*>.*?</p>\s*<div[^>]*>\s*<p[^>]*text-align:\s*center[^>]*>(.*?)</p>',
            html,
            re.I | re.S,
        )
    if dek_m:
        data["dek"] = clean_html_text(dek_m.group(1))

    # Section boundaries
    markers = [
        ("did_you_know", r"Did you know"),
        ("pe", r"Pickle Economics"),
        ("nibbles", r"Nibbles:\s*"),
        ("sexy", r"Sexy Pic\(kle\) of the Week"),
        ("today", r"Today\u2019s Poll|Today's Poll|Today's Pickle Trivia"),
        ("last", r"Last Week's Pickle Trivia"),
        ("footer", r"Were you forwarded"),
    ]
    positions: list[tuple[int, str]] = []
    for name, pat in markers:
        m = re.search(pat, html, re.I)
        if m:
            positions.append((m.start(), name))
    positions.sort()

    def slice_between(start_name: str, end_names: set[str]) -> str:
        start = 0
        end = len(html)
        for pos, name in positions:
            if name == start_name:
                start = pos
                break
        for pos, name in positions:
            if name in end_names and pos > start:
                end = pos
                break
        return html[start:end]

    # Prose: from after headline block to first sidebar section
    prose_start = 0
    h1m = re.search(r"<h1[^>]*>", html, re.I)
    if h1m:
        prose_start = h1m.start()
    else:
        pm = re.search(r'class="cyqtndr"', html, re.I)
        if pm:
            prose_start = pm.start()
    prose_end = positions[0][0] if positions else len(html)
    for pos, name in positions:
        if name in ("did_you_know", "pe", "nibbles", "sexy", "today"):
            prose_end = pos
            break
    prose_html = html[prose_start:prose_end]
    skip_pats = (
        r"weekly email series",
        r"thepicklereport\.com",
        r"Wordmark",
        r"aria-hidden",
        r"^Source:",
    )
    for pm in re.finditer(
        r'<p[^>]*class="[^"]*cg0ylwb[^"]*"[^>]*>(.*?)</p>',
        prose_html,
        re.I | re.S,
    ):
        text = clean_html_text(pm.group(1))
        if len(text) < 25:
            continue
        if any(re.search(p, text, re.I) for p in skip_pats):
            continue
        if text.lower().startswith("source:"):
            src = text.split(":", 1)[-1].strip()
            if src and not data["main_image_credit"]:
                data["main_image_credit"] = src
            continue
        data["prose_paragraphs"].append(text)

    # Header image: first large content image after headline (not wordmark)
    after_head = html[prose_start : prose_start + 12000]
    for im in re.finditer(r'<img[^>]+src="([^"]+)"[^>]*>', after_head, re.I):
        src = unescape(im.group(1))
        tag = im.group(0)
        if "Wordmark" in tag or "wordmark" in src.lower():
            continue
        if 'width="240"' in tag and "Wordmark" in after_head[max(0, im.start() - 200) : im.start()]:
            continue
        if "userimg-assets.customeriomail.com" in src or "width=\"320\"" in tag or "width=\"480\"" in tag:
            data["main_image_url"] = src
            break

    # Pickle Economics
    pe_html = slice_between("pe", {"nibbles", "sexy", "today", "last", "footer"})
    if pe_html:
        pe_title_m = re.search(
            r"Pickle Economics</p>\s*<h2[^>]*>(.*?)</h2>",
            pe_html,
            re.I | re.S,
        )
        if not pe_title_m:
            pe_title_m = re.search(
                r"Pickle Economics[^<]*</p>\s*(?:<h2[^>]*>)?(.*?)</h2>",
                pe_html,
                re.I | re.S,
            )
        if pe_title_m:
            data["pe_heading"] = clean_html_text(pe_title_m.group(1))
        for im in re.finditer(r'<img[^>]+src="([^"]+)"', pe_html, re.I):
            src = unescape(im.group(1))
            if "userimg-assets" in src:
                data["pe_image_url"] = src
                break
        for lm in re.finditer(r"<li[^>]*>(.*?)</li>", pe_html, re.I | re.S):
            line = html_to_text(lm.group(1))
            if line and len(line) > 3:
                data["pe_paragraphs"].append(line)

    # Nibbles
    nib_html = slice_between("nibbles", {"sexy", "today", "last", "footer"})
    if nib_html:
        blocks = re.split(r"<hr[^>]*>", nib_html, flags=re.I)
        for block in blocks:
            if "Nibbles" in block and len(block) < 80:
                continue
            title_m = re.search(r"<h2[^>]*>(.*?)</h2>", block, re.I | re.S)
            link_m = re.search(r'<a\s+href="([^"]+)"', block, re.I)
            if not title_m or not link_m:
                continue
            title = clean_html_text(title_m.group(1))
            if title.lower().startswith("nibbles"):
                continue
            url = unescape(link_m.group(1)).replace("&amp;", "&")
            cta_m = re.search(r"<span[^>]*>(.*?)</span>", block[link_m.start() :], re.I | re.S)
            cta = clean_html_text(cta_m.group(1)) if cta_m else title
            cta = re.sub(r"\s*&gt;\s*$", "", cta).strip()
            data["nibbles"].append({"title": title, "url": url, "cta": cta or title})

    # Sexy pic
    sexy_html = slice_between("sexy", {"today", "last", "footer"})
    if sexy_html:
        for im in re.finditer(r'<img[^>]+src="([^"]+)"', sexy_html, re.I):
            src = unescape(im.group(1))
            if "userimg-assets" in src:
                data["sexy_image_url"] = src
                break
        credit_m = re.search(
            r"(?:Photo by|Source:)\s*([^<]+)",
            sexy_html,
            re.I,
        )
        if credit_m:
            data["sexy_credit"] = clean_html_text(credit_m.group(0))

    # Today's poll / trivia
    today_html = slice_between("today", {"last", "footer"})
    if today_html:
        q_m = re.search(
            r"(?:Today's Poll|Pickle Trivia)</p>\s*<h2[^>]*>(.*?)</h2>",
            today_html,
            re.I | re.S,
        )
        if q_m:
            data["today_question"] = clean_html_text(q_m.group(1))
        for pm in re.finditer(
            r'href="[^"]*[?&]poll=([a-d])[^"]*"[^>]*>.*?<span[^>]*>(.*?)</span>',
            today_html,
            re.I | re.S,
        ):
            letter = pm.group(1).upper()
            opt = clean_html_text(pm.group(2))
            opt = re.sub(r"^[a-d]\)\s*", "", opt, flags=re.I).strip()
            if opt:
                data["today_options"].append((letter, opt))

    last_html = slice_between("last", {"footer"})
    if last_html:
        q_m = re.search(r"<p[^>]*>([^<]*\?[^<]*)</p>", last_html, re.I)
        if q_m:
            data["last_question"] = clean_html_text(q_m.group(1))

    return data


def email_data_to_content(data: dict, style_p: ET.Element) -> dict:
    content = empty_content()
    if data.get("headline"):
        content["headline"] = [make_text_paragraph(data["headline"], style_p)]
    if data.get("dek"):
        content["dek"] = [make_text_paragraph(data["dek"], style_p)]
    for para in data.get("prose_paragraphs", []):
        if para:
            content["prose"].append(make_text_paragraph(para, style_p))
    if data.get("main_image_url"):
        url = data["main_image_url"]
        content["main_image_external_url"] = url
        content["main_image_issue_link"] = [make_url_paragraph(url, style_p)]
    if data.get("main_image_credit"):
        content["main_image_credit"] = [
            make_text_paragraph(data["main_image_credit"], style_p)
        ]
    if data.get("pe_heading"):
        content["pe_title"] = [make_text_paragraph(data["pe_heading"], style_p)]
    for line in data.get("pe_paragraphs", []):
        content["pe_graph_info"].append(make_text_paragraph(line, style_p))
    if data.get("pe_image_url"):
        content["graph_issue_link"] = [make_url_paragraph(data["pe_image_url"], style_p)]
    for nb in data.get("nibbles", []):
        content["nibbles"].append(
            {
                "blurb": [make_text_paragraph(nb["title"], style_p)],
                "cta": [make_text_paragraph(nb.get("cta") or nb["title"], style_p)],
                "url": [make_url_paragraph(nb["url"], style_p)],
            }
        )
    if data.get("sexy_image_url"):
        url = data["sexy_image_url"]
        content["sexy_issue_link"] = [make_url_paragraph(url, style_p)]
    if data.get("sexy_credit"):
        content["sexy_credit"] = [make_text_paragraph(data["sexy_credit"], style_p)]
    if data.get("today_question"):
        content["today_trivia"]["question"] = [
            make_text_paragraph(data["today_question"], style_p)
        ]
    content["today_trivia"]["options"] = list(data.get("today_options", []))
    if data.get("last_question"):
        content["last_trivia"]["question"] = [
            make_text_paragraph(data["last_question"], style_p)
        ]
    content["last_trivia"]["options"] = list(data.get("last_options", []))
    return content


def prose_char_count(content: dict) -> int:
    return sum(len(paragraph_text(p, {})) for p in content.get("prose", []))


def merge_content_layers(docx_content: dict, email_content: dict) -> dict:
    """Prefer email for modules docx skipped; keep richer prose from either source."""
    out = empty_content()
    for key in (
        "slug",
        "issue_num",
        "email_subject",
        "email_preheader",
        "publishing_date",
        "author",
    ):
        out[key] = list(docx_content.get(key) or email_content.get(key) or [])

    out["headline"] = list(
        docx_content.get("headline") or email_content.get("headline") or []
    )
    out["dek"] = list(email_content.get("dek") or docx_content.get("dek") or [])

    docx_prose_len = prose_char_count(docx_content)
    email_prose_len = prose_char_count(email_content)
    if email_prose_len > docx_prose_len * 1.1:
        out["prose"] = list(email_content.get("prose") or [])
    else:
        out["prose"] = list(docx_content.get("prose") or email_content.get("prose") or [])

    if email_content.get("main_image_issue_link") or email_content.get("main_image_external_url"):
        out["main_image_issue_link"] = list(email_content.get("main_image_issue_link") or [])
        out["main_image_external_url"] = email_content.get("main_image_external_url") or ""
        if email_content.get("main_image_credit"):
            out["main_image_credit"] = list(email_content["main_image_credit"])
        else:
            out["main_image_credit"] = list(docx_content.get("main_image_credit") or [])
    else:
        out["main_image_issue_link"] = list(docx_content.get("main_image_issue_link") or [])
        out["main_image_external_url"] = docx_content.get("main_image_external_url") or ""
        out["main_image_credit"] = list(docx_content.get("main_image_credit") or [])

    for field in (
        "pe_title",
        "pe_graph_info",
        "pe_credit",
        "pe_urls",
        "graph_issue_link",
        "sexy_issue_link",
        "sexy_credit",
    ):
        out[field] = list(
            email_content.get(field) or docx_content.get(field) or []
        )

    out["nibbles"] = list(email_content.get("nibbles") or docx_content.get("nibbles") or [])

    for key in ("today_trivia", "last_trivia"):
        out[key] = {"question": [], "options": [], "correct_letter": ""}
        for side in (email_content, docx_content):
            block = side.get(key) or {}
            if block.get("question") and not out[key]["question"]:
                out[key]["question"] = list(block["question"])
            if block.get("options") and not out[key]["options"]:
                out[key]["options"] = list(block["options"])
            if block.get("correct_letter"):
                out[key]["correct_letter"] = block["correct_letter"]
    return out


def analyze_content(content: dict, tier: str) -> dict:
    modules: list[str] = []
    warnings: list[str] = []
    skipped: list[str] = []
    if tier == "legacy":
        skipped.extend(sorted(LEGACY_SKIP_HEADERS))
    if content.get("headline"):
        modules.append("headline")
    if content.get("dek"):
        modules.append("dek")
    if content.get("prose"):
        modules.append("prose")
    if content.get("main_image_issue_link") or content.get("main_image_external_url"):
        modules.append("main_image")
    if content.get("pe_title") or content.get("pe_graph_info"):
        modules.append("pickle_economics")
    if content.get("nibbles"):
        modules.append("nibbles")
    if content.get("sexy_issue_link"):
        modules.append("sexy_pic")
    if content.get("today_trivia", {}).get("question") or content.get(
        "today_trivia", {}
    ).get("options"):
        modules.append("trivia")
    if "+email" in tier or tier == "email":
        modules.append("email_html")
    prose_len = sum(len(paragraph_text(p, {})) for p in content.get("prose", []))
    if not content.get("prose"):
        warnings.append("no_prose")
    elif prose_len < 200:
        warnings.append("thin_prose")
    if not content.get("main_image_issue_link") and not content.get("main_image_external_url"):
        warnings.append("no_main_image")
    if tier == "unknown":
        warnings.append("unknown_tier")
    return {"modulesFound": modules, "modulesSkipped": skipped, "warnings": warnings}


def patch_publishing_date_in_docx(docx_path: Path, date_str: str) -> None:
    with zipfile.ZipFile(docx_path, "r") as zin:
        rel_files = {name: zin.read(name) for name in zin.namelist()}
        rels = load_rels(zin)
    root = ET.fromstring(rel_files["word/document.xml"])
    paras = list(root.find(f".//{W}body").findall(f"{W}p"))
    style_p = paras[0] if paras else ET.Element(f"{W}p")
    i = 0
    while i < len(paras):
        text = paragraph_text(paras[i], rels)
        if text and normalize_label(text) == "PUBLISHING DATE":
            j = i + 1
            while j < len(paras):
                t2 = paragraph_text(paras[j], rels)
                if t2 and is_template_label(t2):
                    paras.insert(j, make_text_paragraph(date_str, style_p))
                    break
                if t2:
                    for t in paras[j].findall(f".//{W}t"):
                        if t.text is not None:
                            t.text = date_str
                    break
                j += 1
            else:
                paras.append(make_text_paragraph(date_str, style_p))
            break
        i += 1
    body = root.find(f".//{W}body")
    for child in list(body):
        body.remove(child)
    for p in paras:
        body.append(p)
    rel_files["word/document.xml"] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    with zipfile.ZipFile(docx_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, data in rel_files.items():
            zout.writestr(name, data)


def copy_template_for_issue(
    template_path: Path,
    output_path: Path,
    release_date: str,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(template_path, output_path)
    if release_date:
        patch_publishing_date_in_docx(output_path, release_date)
    print(f"Wrote {output_path} (template copy)")


def make_text_paragraph(text: str, template_p: ET.Element) -> ET.Element:
    p = ET.Element(f"{W}p")
    pPr = template_p.find(f"{W}pPr")
    if pPr is not None:
        p.append(deepcopy(pPr))
    r = ET.SubElement(p, f"{W}r")
    ET.SubElement(r, f"{W}rPr")
    t = ET.SubElement(r, f"{W}t")
    t.text = text
    t.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    ensure_paragraph_spacing(p)
    return p


def extract_issue_content(path: Path) -> dict:
    with zipfile.ZipFile(path) as z:
        rels = load_rels(z)
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f".//{W}body")
    paras = list(body.findall(f"{W}p"))

    content = empty_content()

    state: str | None = None
    nibble: dict | None = None
    i = 0
    while i < len(paras):
        p = paras[i]
        text = paragraph_text(p, rels)
        hl = highlight_letter(p)

        label_match = match_issue_label(text) if text else None
        if not label_match and text:
            upper = text.upper()
            if upper.startswith("HEADLINE"):
                glued = split_label_value(text, "HEADLINE")
                if glued:
                    content["headline"] = [make_text_paragraph(glued, p)]
                    state = None
                    i += 1
                    continue
                label_match = ("HEADLINE", "_headline_block")
            elif upper.startswith("DEK") and not upper.startswith("DEK:"):
                glued = split_label_value(text, "DEK")
                if glued:
                    content["dek"] = [make_text_paragraph(glued, p)]
                    state = None
                    i += 1
                    continue
        if label_match:
            _, field = label_match
            if field == "_nibble":
                nibble = {"blurb": [], "cta": [], "url": []}
                content["nibbles"].append(nibble)
                state = "_nibble"
            else:
                state = field
            i += 1
            continue

        if state == "_headline_block":
            if text:
                if re.search(r"DEK", text, re.I):
                    title_part = re.split(r"\s*DEK\s*", text, maxsplit=1, flags=re.I)[0].strip()
                    content["headline"] = [make_text_paragraph(title_part, p)]
                elif not content["dek"]:
                    content["dek"] = [clone_paragraph(p)]
                elif not content["headline"]:
                    content["headline"].append(clone_paragraph(p))
            i += 1
            continue

        if state == "_nibble" and nibble is not None:
            if text.lower().startswith("blurb:"):
                nibble["blurb"] = [strip_prefix_paragraph(p, "Blurb")]
            elif text.lower().startswith("link:"):
                nibble["url"] = [strip_prefix_paragraph(p, "Link")]
            elif text.lower().startswith("source:"):
                nibble["cta"] = [strip_prefix_paragraph(p, "Source")]
            i += 1
            continue

        if state == "_today_trivia":
            if text.lower().startswith("question:"):
                content["today_trivia"]["question"] = [strip_prefix_paragraph(p, "Question")]
            elif re.match(r"^[A-D]:", text):
                letter, opt_text = text[0], text[3:].strip()
                content["today_trivia"]["options"].append((letter, opt_text))
                if hl:
                    content["today_trivia"]["correct_letter"] = hl
            i += 1
            continue

        if state == "_last_trivia":
            if text.lower().startswith("question:"):
                content["last_trivia"]["question"] = [strip_prefix_paragraph(p, "Question")]
            elif re.match(r"^[A-D]:", text):
                letter, opt_text = text[0], text[3:].strip()
                content["last_trivia"]["options"].append((letter, opt_text))
                if hl:
                    content["last_trivia"]["correct_letter"] = hl
            i += 1
            continue

        if state == "_main_image_skip":
            if text and ISSUE_DRIVE_LINK_RE.match(text):
                content["main_image_issue_link"] = [clone_paragraph(p)]
            i += 1
            continue

        if state == "_graph_skip":
            if text and ISSUE_DRIVE_LINK_RE.match(text) and "graph" in text.lower():
                content["graph_issue_link"] = [clone_paragraph(p)]
            i += 1
            continue

        if state in ("_nibbles_start",):
            i += 1
            continue

        if state == "_sexy_skip":
            if text and ISSUE_DRIVE_LINK_RE.match(text) and "sexy" in text.lower():
                content["sexy_issue_link"] = [clone_paragraph(p)]
            i += 1
            continue

        if state == "author" and paragraph_has_content(p, rels):
            if text.lower().startswith("by "):
                cp = clone_paragraph(p)
                for t in cp.findall(f".//{W}t"):
                    if t.text and t.text.strip().lower().startswith("by "):
                        t.text = t.text.strip()[3:].lstrip()
                content["author"].append(cp)
            else:
                content["author"].append(clone_paragraph(p))
            i += 1
            continue

        if state == "pe_urls" and paragraph_has_content(p, rels):
            content["pe_urls"].append(clone_paragraph(p))
            i += 1
            continue

        if state == "prose" and paragraph_has_content(p, rels):
            content["prose"].append(clone_paragraph(p))
            i += 1
            continue

        if state == "sexy_credit" and paragraph_has_content(p, rels):
            content["sexy_credit"].append(clone_paragraph(p))
            i += 1
            continue

        if state == "pe_graph_info" and paragraph_has_content(p, rels):
            content["pe_graph_info"].append(clone_paragraph(p))
            i += 1
            continue

        if state == "pe_credit" and paragraph_has_content(p, rels):
            content["pe_credit"].append(clone_paragraph(p))
            i += 1
            continue

        if state in ("slug", "issue_num", "email_subject", "email_preheader", "pe_title", "main_image_credit"):
            if paragraph_has_content(p, rels):
                content[state].append(clone_paragraph(p))
            i += 1
            continue

        i += 1

    return content


def skip_until_next_label(
    template_paras: list[ET.Element],
    i: int,
    rels: dict[str, str],
) -> int:
    while i < len(template_paras):
        t = paragraph_text(template_paras[i], rels)
        if t and is_template_label(t):
            break
        i += 1
    return i


def emit_template_empties(
    template_paras: list[ET.Element],
    start: int,
    end: int,
    out: list[ET.Element],
) -> None:
    for j in range(start, end):
        if not paragraph_text(template_paras[j], {}):
            out.append(clone_paragraph(template_paras[j]))


def merge_into_template(
    template_path: Path,
    issue_path: Path | None,
    output_path: Path,
    metadata: dict | None = None,
    email_path: Path | None = None,
) -> dict:
    tier = "empty"
    issue = empty_content()
    if issue_path and issue_path.is_file():
        issue, tier = extract_content(issue_path)
    with zipfile.ZipFile(template_path) as z:
        rels_tpl = load_rels(z)
        root_tpl = ET.fromstring(z.read("word/document.xml"))
    tpl_paras = list(root_tpl.find(f".//{W}body").findall(f"{W}p"))
    style_p = tpl_paras[0] if tpl_paras else ET.Element(f"{W}p")
    if email_path and email_path.is_file():
        email_c = email_data_to_content(parse_email_html(email_path), style_p)
        issue = merge_content_layers(issue, email_c)
        tier = f"{tier}+email" if tier != "empty" else "email"
    if metadata:
        apply_metadata_overlay(issue, metadata, style_p)
    issue_rel_targets = (
        load_issue_rel_targets(issue_path)
        if issue_path and issue_path.is_file()
        else {}
    )
    template_rel_targets = load_issue_rel_targets(template_path)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_in = Path(tmp) / "doc.docx"
        shutil.copy2(template_path, tmp_in)
        with zipfile.ZipFile(tmp_in, "r") as zin:
            rel_files = {name: zin.read(name) for name in zin.namelist()}

    with zipfile.ZipFile(template_path) as z:
        rels = load_rels(z)
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f".//{W}body")
    template_paras = list(body.findall(f"{W}p"))

    section: str | None = None
    nibble_idx = 0
    out_paras: list[ET.Element] = []
    i = 0

    while i < len(template_paras):
        p = template_paras[i]
        text = paragraph_text(p, rels)
        label = is_template_label(text) if text else None

        if not label:
            if not text:
                append_paragraph(out_paras, clone_paragraph(p))
            elif section == "prose" and issue.get("prose"):
                pass  # skip leftover template prose
            elif section == "pe_block" and text.upper().startswith("GRAPH"):
                cp = clone_paragraph(p)
                if issue.get("graph_issue_link"):
                    patch_template_issue_drive_link(
                        cp, issue["graph_issue_link"][0], issue_rel_targets, rel_files
                    )
                append_paragraph(out_paras, cp)
            elif section == "pe_block" and not issue.get("pe_graph_info"):
                append_paragraph(out_paras, clone_paragraph(p))
            elif section == "pe_block":
                pass  # skip template sample chart/credit/url text
            else:
                append_paragraph(out_paras, clone_paragraph(p))
            i += 1
            continue

        # --- labeled slot ---
        if label == "PROSE":
            section = "prose"
        elif "TODAY" in label:
            section = "today"
        elif "LAST WEEK" in label:
            section = "last"
        elif label.startswith("ITEM"):
            section = "nibbles"
        elif label.startswith("NIBBLES"):
            section = "nibbles"
            nibble_idx = 0
        elif label == "PICKLE ECONOMICS TITLE":
            section = "pe_block"
        elif label not in (
            "QUESTION",
            "OPTION A",
            "OPTION B",
            "OPTION C",
            "OPTION D",
            "CORRECT ANSWER",
        ):
            section = None

        if label == "MAIN IMAGE":
            main_links = issue.get("main_image_issue_link") or []
            link_para = main_links[0] if main_links else None
            if link_para is not None:
                link_text = paragraph_text(link_para, {})
                if ISSUE_DRIVE_LINK_RE.match(link_text) or any(
                    ISSUE_DRIVE_LINK_RE.match(hyperlink_text(h))
                    for h in link_para.findall(f".//{W}hyperlink")
                ):
                    cp = build_main_image_drive_line(
                        template_paras,
                        rels,
                        link_para,
                        issue_rel_targets,
                        template_rel_targets,
                        rel_files,
                        p,
                    )
                    append_paragraph(out_paras, cp)
                else:
                    append_paragraph(out_paras, clone_paragraph(p))
                    ext = issue.get("main_image_external_url") or link_text
                    if ext and URL_RE.search(ext):
                        append_paragraph(
                            out_paras,
                            make_external_hyperlink_paragraph(ext, p, rel_files),
                        )
            else:
                append_paragraph(out_paras, clone_paragraph(p))
            i += 1
            while i < len(template_paras):
                t2 = paragraph_text(template_paras[i], rels)
                if t2 and is_template_label(t2):
                    break
                if not t2:
                    append_paragraph(out_paras, clone_paragraph(template_paras[i]))
                i += 1
            continue

        if label == "CREDIT / COURTESY LINE":
            for para in issue.get("pe_graph_info", []):
                append_paragraph(
                    out_paras,
                    para,
                    issue_rel_targets=issue_rel_targets,
                    rel_files=rel_files,
                    from_issue=True,
                )
            append_paragraph(out_paras, clone_paragraph(p))
            i += 1
            slot_start = i
            credit_paras: list[ET.Element] = []
            if issue.get("pe_credit") and issue.get("pe_urls"):
                credit_paras = [
                    build_pe_credit_paragraph(
                        issue["pe_credit"][0],
                        issue["pe_urls"],
                        issue_rel_targets,
                        rel_files,
                        p,
                    )
                ]
            elif issue.get("pe_credit"):
                credit_paras = issue["pe_credit"]
            if credit_paras:
                i = skip_until_next_label(template_paras, slot_start, rels)
                for para in credit_paras:
                    append_paragraph(
                        out_paras,
                        para,
                        issue_rel_targets=issue_rel_targets,
                        rel_files=rel_files,
                        from_issue=True,
                    )
            else:
                i = skip_until_next_label(template_paras, slot_start, rels)
            continue

        append_paragraph(out_paras, clone_paragraph(p))
        i += 1
        slot_start = i

        def finish_slot(injected: list[ET.Element], *, from_issue: bool = True) -> None:
            nonlocal i
            i = skip_until_next_label(template_paras, slot_start, rels)
            for para in injected:
                append_paragraph(
                    out_paras,
                    para,
                    issue_rel_targets=issue_rel_targets,
                    rel_files=rel_files,
                    from_issue=from_issue,
                )

        if label == "HEADLINE" and issue["headline"]:
            finish_slot(issue["headline"])
            continue
        if label == "DEK" and issue["dek"]:
            finish_slot(issue["dek"])
            continue
        if label == "SLUG" and issue["slug"]:
            finish_slot(issue["slug"])
            continue
        if label == "MAIN IMAGE CREDIT" and issue["main_image_credit"]:
            finish_slot(issue["main_image_credit"])
            continue
        if label == "PUBLISHING DATE":
            if issue["publishing_date"]:
                finish_slot(issue["publishing_date"])
            else:
                i = skip_until_next_label(template_paras, slot_start, rels)
            continue
        if label == "AUTHOR" and issue["author"]:
            finish_slot(issue["author"])
            continue
        if label == "PROSE" and issue["prose"]:
            finish_slot(issue["prose"])
            continue
        if label == "PICKLE ECONOMICS TITLE" and issue["pe_title"]:
            # Replace only the title line; keep template GRAPH link + spacing below.
            if i < len(template_paras) and paragraph_text(template_paras[i], rels):
                i += 1
            for para in issue["pe_title"]:
                append_paragraph(
                    out_paras,
                    para,
                    issue_rel_targets=issue_rel_targets,
                    rel_files=rel_files,
                    from_issue=True,
                )
            continue

        if label == "GRAPH INFORMATION URL" and issue.get("pe_urls"):
            finish_slot(issue["pe_urls"])
            continue

        if label == "CREDIT" and issue.get("sexy_credit"):
            finish_slot(issue["sexy_credit"])
            continue
        if label == "SEXY PIC(KLE) OF THE WEEK":
            # This paragraph is the drive header line (not a separate uppercase label).
            if issue.get("sexy_issue_link"):
                patch_template_issue_drive_link(
                    out_paras[-1], issue["sexy_issue_link"][0], issue_rel_targets, rel_files
                )
            while i < len(template_paras):
                t2 = paragraph_text(template_paras[i], rels)
                if t2 and is_template_label(t2):
                    break
                if not t2:
                    append_paragraph(out_paras, clone_paragraph(template_paras[i]))
                i += 1
            continue

        if label.startswith("ITEM") and nibble_idx < len(issue["nibbles"]):
            nb = issue["nibbles"][nibble_idx]
            injected: list[ET.Element] = []
            if nb.get("blurb"):
                injected.extend(nb["blurb"])
            if nb.get("cta"):
                injected.extend(nb["cta"])
            if nb.get("url"):
                injected.extend(nb["url"])
            finish_slot(injected)
            nibble_idx += 1
            continue

        if label == "QUESTION" and section == "today" and issue["today_trivia"]["question"]:
            finish_slot(issue["today_trivia"]["question"])
            continue
        if label == "QUESTION" and section == "last" and issue["last_trivia"]["question"]:
            finish_slot(issue["last_trivia"]["question"])
            continue

        if label.startswith("OPTION") and section == "today":
            letter = label.split()[-1]
            finish_slot(
                [
                    make_text_paragraph(opt, p)
                    for L, opt in issue["today_trivia"]["options"]
                    if L == letter
                ]
            )
            continue
        if label.startswith("OPTION") and section == "last":
            letter = label.split()[-1]
            finish_slot(
                [
                    make_text_paragraph(opt, p)
                    for L, opt in issue["last_trivia"]["options"]
                    if L == letter
                ]
            )
            continue

        if label == "CORRECT ANSWER" and section == "today" and issue["today_trivia"]["correct_letter"]:
            finish_slot([make_text_paragraph(issue["today_trivia"]["correct_letter"], p)])
            continue
        if label == "CORRECT ANSWER" and section == "last" and issue["last_trivia"]["correct_letter"]:
            finish_slot([make_text_paragraph(issue["last_trivia"]["correct_letter"], p)])
            continue

        if label == "ISSUE #" and issue["issue_num"]:
            finish_slot(issue["issue_num"])
            continue
        if label == "EMAIL SUBJECT LINE" and issue["email_subject"]:
            finish_slot(issue["email_subject"])
            continue
        if label == "EMAIL PRE-HEADER" and issue["email_preheader"]:
            finish_slot(issue["email_preheader"])
            continue

        # label with no issue content: drop template placeholder text until next label
        i = skip_until_next_label(template_paras, slot_start, rels)

    template_rids = collect_hyperlink_rids(template_paras)
    issue_rids_needed = collect_hyperlink_rids(out_paras) - template_rids

    for child in list(body):
        body.remove(child)
    for p in out_paras:
        body.append(p)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    rid_map = merge_issue_relationships(
        rel_files,
        issue_path if issue_path and issue_path.is_file() else template_path,
        issue_rids_needed,
    )
    remap_hyperlink_rids(out_paras, rid_map)
    for child in list(body):
        body.remove(child)
    for p in out_paras:
        body.append(p)
    rel_files["word/document.xml"] = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zout:
        for name, data in rel_files.items():
            zout.writestr(name, data)
    print(f"Wrote {output_path}")
    return analyze_content(issue, tier)


def run_batch(
    manifest_path: Path,
    template_path: Path,
    output_dir: Path,
    report_path: Path | None,
) -> list[dict]:
    base = manifest_path.parent
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    source_dir = base / manifest.get("sourceDir", "source")
    out_dir = base / manifest.get("outputDir", "output")
    if output_dir:
        out_dir = output_dir

    email_paths = discover_email_html_files(source_dir)
    email_by_issue = match_emails_to_issues(email_paths, manifest.get("issues", []))
    if email_by_issue:
        print(f"Matched {len(email_by_issue)} email HTML file(s) to issues")

    results: list[dict] = []
    for entry in manifest.get("issues", []):
        issue_num = entry.get("issue")
        slug = entry.get("slug", "")
        meta = {
            "slug": slug,
            "releaseDate": entry.get("releaseDate", ""),
            "fullName": entry.get("fullName", ""),
        }
        output_path = out_dir / f"{slug}.docx"
        row: dict = {
            "issue": issue_num,
            "slug": slug,
            "outputPath": str(output_path),
            "success": False,
        }
        try:
            if entry.get("copyTemplate"):
                copy_template_for_issue(
                    template_path,
                    output_path,
                    meta.get("releaseDate", ""),
                )
                row["tier"] = "template_copy"
                row["success"] = True
                row.update(
                    {
                        "modulesFound": ["template"],
                        "modulesSkipped": [],
                        "warnings": [],
                    }
                )
            else:
                source_file = entry.get("sourceFile", "")
                issue_path = source_dir / source_file
                if not issue_path.is_file():
                    row["error"] = f"Missing source: {issue_path}"
                    row["warnings"] = ["missing_source"]
                else:
                    email_path = email_by_issue.get(issue_num)
                    if entry.get("emailHtml"):
                        candidate = source_dir / entry["emailHtml"]
                        if candidate.is_file():
                            email_path = candidate
                    analysis = merge_into_template(
                        template_path,
                        issue_path,
                        output_path,
                        metadata=meta,
                        email_path=email_path,
                    )
                    row.update(analysis)
                    if email_path:
                        row["emailHtml"] = str(email_path)
                    row["success"] = True
        except Exception as exc:
            row["error"] = str(exc)
            row["warnings"] = row.get("warnings", []) + ["exception"]
        results.append(row)

    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(
            json.dumps({"issues": results}, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Wrote report {report_path}")

    ok = sum(1 for r in results if r.get("success"))
    print(f"Batch complete: {ok}/{len(results)} succeeded")
    return results


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Merge Pickle Report issue .docx files into the Canvas template."
    )
    parser.add_argument("--template", type=Path, required=True)
    parser.add_argument("--issue", type=Path, help="Single issue source .docx")
    parser.add_argument("--email", type=Path, help="Customer.io email HTML export")
    parser.add_argument("--output", type=Path, help="Single output .docx path")
    parser.add_argument("--batch", action="store_true", help="Process issues-manifest.json")
    parser.add_argument(
        "--manifest",
        type=Path,
        default=Path("studio-the-pickle-report/canvas-imports/issues-manifest.json"),
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("studio-the-pickle-report/canvas-imports/output"),
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("studio-the-pickle-report/canvas-imports/batch-report.json"),
    )
    args = parser.parse_args()

    if args.batch:
        run_batch(args.manifest, args.template, args.output_dir, args.report)
        return

    if not args.output:
        parser.error("--output is required unless --batch is set")
    if not args.issue and not args.email:
        parser.error("Provide --issue and/or --email")
    merge_into_template(
        args.template,
        args.issue,
        args.output,
        email_path=args.email,
    )


if __name__ == "__main__":
    main()
