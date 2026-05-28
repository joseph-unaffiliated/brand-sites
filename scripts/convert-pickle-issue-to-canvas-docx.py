#!/usr/bin/env python3
"""
Convert a Pickle Report issue .docx (Google Doc export) into a Canvas-ready .docx.

Preserves Word hyperlinks, bold labels, and paragraph spacing by copying the OOXML
package and only rewriting label lines to match canvas-templates/pickle-weekly-issue-template.md.

Usage:
  python3 scripts/convert-pickle-issue-to-canvas-docx.py \\
    --input "studio-the-pickle-report/canvas-imports/source/Issue 20.docx" \\
    --output studio-the-pickle-report/canvas-imports/output/areligiousloveofpickles.docx

Batch:
  python3 scripts/convert-pickle-issue-to-canvas-docx.py --input-dir studio-the-pickle-report/canvas-imports/source
"""

from __future__ import annotations

import argparse
import re
import shutil
import tempfile
import zipfile
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

# Exact w:t replacements (old Google Doc labels → current Canvas template labels)
TEXT_REPLACEMENTS = {
    "IMAGE (link to image in Header Image drive)": "MAIN IMAGE (link to image in Header Image drive)",
    "PHOTO SOURCE": "MAIN IMAGE CREDIT",
    "BODY": "PROSE",
    "GRAPH INFORMATION SOURCE": "CREDIT / COURTESY LINE",
    "SEXY PIC(KLE) OF THE WEEK IMAGE SOURCE": "CREDIT",
    "Source 1": "ITEM 1",
    "Source 2": "ITEM 2",
    "Source 3": "ITEM 3",
    "Source 4": "ITEM 4",
    "Blurb:": "",  # template uses blurb line without prefix
    "Link:": "",
    "Source:": "",
    "Question:": "QUESTION",
    "A:": "OPTION A",
    "B:": "OPTION B",
    "C:": "OPTION C",
    "D:": "OPTION D",
    "PUBLISHING DATE": "PUBLISHING DATE",  # noop placeholder
}


def slug_from_docx_name(path: Path) -> str:
    name = path.stem
    name = re.sub(r"^the pickle report\s*-\s*", "", name, flags=re.I)
    name = re.sub(r"\s*issue\s*\d+\s*$", "", name, flags=re.I)
    return re.sub(r"[^a-z0-9]+", "", name.lower()) or "issue"


def apply_label_replacements(document_xml: bytes) -> bytes:
    text = document_xml.decode("utf-8")
    for old, new in TEXT_REPLACEMENTS.items():
        if not old:
            continue
        # Replace only inside <w:t>...</w:t> when the entire text node matches
        pattern = re.compile(
            rf"(<w:t(?:\s[^>]*)?>){re.escape(old)}(</w:t>)",
            re.IGNORECASE if old.isupper() and len(old) < 20 else 0,
        )
        if old in ("BODY", "PROSE"):
            # exact case-sensitive for short labels
            pattern = re.compile(rf"(<w:t(?:\s[^>]*)?>){re.escape(old)}(</w:t>)")
        text = pattern.sub(lambda m: f"{m.group(1)}{new}{m.group(2)}", text)
    return text.encode("utf-8")


def convert_docx(input_path: Path, output_path: Path, rename_labels: bool = True) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        tmp_in = Path(tmp) / "in.docx"
        shutil.copy2(input_path, tmp_in)
        with zipfile.ZipFile(tmp_in, "r") as zin:
            files = {name: zin.read(name) for name in zin.namelist()}
        if rename_labels and "word/document.xml" in files:
            files["word/document.xml"] = apply_label_replacements(files["word/document.xml"])
        with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for name, data in files.items():
                zout.writestr(name, data)
    print(f"Wrote {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert Pickle issue docx for Sanity Canvas")
    parser.add_argument("--input", type=Path, help="Single source .docx")
    parser.add_argument("--output", type=Path, help="Output .docx path")
    parser.add_argument(
        "--input-dir",
        type=Path,
        help="Convert all .docx in directory to canvas-imports/output/<slug>.docx",
    )
    parser.add_argument(
        "--no-rename-labels",
        action="store_true",
        help="Copy verbatim (no label renames)",
    )
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[1]
    out_dir = repo / "studio-the-pickle-report" / "canvas-imports" / "output"

    if args.input_dir:
        for src in sorted(args.input_dir.glob("*.docx")):
            if src.name.startswith("~$"):
                continue
            slug = slug_from_docx_name(src)
            convert_docx(
                src,
                out_dir / f"{slug}.docx",
                rename_labels=not args.no_rename_labels,
            )
        return

    if not args.input or not args.output:
        parser.error("Provide --input and --output, or --input-dir")

    convert_docx(args.input, args.output, rename_labels=not args.no_rename_labels)


if __name__ == "__main__":
    main()
