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
import re
import shutil
import tempfile
import zipfile
from copy import deepcopy
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
PARA_SPACING_AFTER = "200"
ISSUE_DRIVE_LINK_RE = re.compile(r"^Issue \d+ ", re.I)

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
    for key in h.attrib:
        if key.endswith("}id"):
            h.attrib[key] = rid
            return
    h.set(R_ID, rid)


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

    content: dict = {
        "slug": [],
        "issue_num": [],
        "email_subject": [],
        "email_preheader": [],
        "headline": [],
        "dek": [],
        "main_image_issue_link": [],
        "main_image_credit": [],
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

    state: str | None = None
    nibble: dict | None = None
    i = 0
    while i < len(paras):
        p = paras[i]
        text = paragraph_text(p, rels)
        hl = highlight_letter(p)

        label_match = match_issue_label(text) if text else None
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


def merge_into_template(template_path: Path, issue_path: Path, output_path: Path) -> None:
    issue = extract_issue_content(issue_path)
    issue_rel_targets = load_issue_rel_targets(issue_path)
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
            if issue.get("main_image_issue_link"):
                cp = build_main_image_drive_line(
                    template_paras,
                    rels,
                    issue["main_image_issue_link"][0],
                    issue_rel_targets,
                    template_rel_targets,
                    rel_files,
                    p,
                )
                append_paragraph(out_paras, cp)
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
    rid_map = merge_issue_relationships(rel_files, issue_path, issue_rids_needed)
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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--template", type=Path, required=True)
    parser.add_argument("--issue", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    merge_into_template(args.template, args.issue, args.output)


if __name__ == "__main__":
    main()
