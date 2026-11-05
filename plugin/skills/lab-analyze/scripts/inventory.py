"""Inventory of course materials: prints outlines, never full content.

Usage: python inventory.py <materials-dir>

Reports, per file:
  * .ipynb  - headings, code-cell count, imported modules, exercise headings
  * .pdf    - page count, table of contents (or "no outline"), exercise headings
Needs only the standard library plus nbformat and pypdf. Exits 0 with
"no materials found" when the directory holds no notebook or PDF.
"""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

MAX_HEADINGS = 80  # per file; the rest is summarised as a count
MAX_TEXT = 100  # characters per printed heading
EXERCISE_RE = re.compile(
    r"\b(aufgabe|aufgaben|übung|uebung|übungen|exercise|exercises|task|problem|praktikum|lab)\b",
    re.IGNORECASE,
)
IMPORT_FALLBACK_RE = re.compile(r"^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w., ]+))", re.MULTILINE)


def clip(text: str) -> str:
    text = " ".join(text.split())
    return text if len(text) <= MAX_TEXT else text[: MAX_TEXT - 1] + "…"


def imports_of(source: str) -> set[str]:
    found: set[str] = set()
    try:
        for node in ast.walk(ast.parse(source)):
            if isinstance(node, ast.Import):
                found.update(a.name.split(".")[0] for a in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module and node.level == 0:
                found.add(node.module.split(".")[0])
    except SyntaxError:
        # Cells with magics (%matplotlib, !pip) do not parse; fall back to a regex.
        for m in IMPORT_FALLBACK_RE.finditer(source):
            if m.group(1):
                found.add(m.group(1).split(".")[0])
            else:
                found.update(p.strip().split(" ")[0].split(".")[0] for p in m.group(2).split(","))
    return {name for name in found if name}


def report_notebook(path: Path, root: Path) -> None:
    import nbformat

    print(f"## {path.relative_to(root).as_posix()}  (notebook)")
    try:
        nb = nbformat.read(path, as_version=4)
    except Exception as exc:  # unreadable or malformed notebook
        print(f"  could not be read: {type(exc).__name__}: {clip(str(exc))}")
        return
    headings: list[tuple[int, int, str]] = []  # (cell index, level, text)
    code_cells = 0
    modules: set[str] = set()
    for index, cell in enumerate(nb.cells):
        if cell.cell_type == "code":
            code_cells += 1
            modules |= imports_of(cell.source)
        elif cell.cell_type == "markdown":
            for line in cell.source.splitlines():
                m = re.match(r"^(#{1,6})\s+(.*\S)", line)
                if m:
                    headings.append((index, len(m.group(1)), m.group(2)))
    print(f"  cells: {len(nb.cells)}, code cells: {code_cells}")
    print(f"  imports: {', '.join(sorted(modules)) if modules else 'none'}")
    print(f"  headings ({len(headings)}):")
    for index, level, text in headings[:MAX_HEADINGS]:
        print(f"    {'  ' * (level - 1)}- [cell {index}] {clip(text)}")
    if len(headings) > MAX_HEADINGS:
        print(f"    ... {len(headings) - MAX_HEADINGS} more headings not shown")
    exercises = [(i, t) for i, _, t in headings if EXERCISE_RE.search(t)]
    print(f"  exercises by heading keyword ({len(exercises)}):")
    for index, text in exercises[:MAX_HEADINGS]:
        print(f"    - [cell {index}] {clip(text)}")


def outline_entries(reader, items, depth=0):
    for item in items:
        if isinstance(item, list):
            yield from outline_entries(reader, item, depth + 1)
        else:
            try:
                page = reader.get_destination_page_number(item) + 1
            except Exception:
                page = None
            yield depth, clip(str(item.title)), page


def report_pdf(path: Path, root: Path) -> None:
    from pypdf import PdfReader

    print(f"## {path.relative_to(root).as_posix()}  (pdf)")
    try:
        reader = PdfReader(str(path))
        pages = len(reader.pages)
        entries = list(outline_entries(reader, reader.outline))
    except Exception as exc:  # encrypted, damaged or unsupported file
        print(f"  could not be read: {type(exc).__name__}: {clip(str(exc))}")
        return
    print(f"  pages: {pages}")
    if not entries:
        print("  table of contents: no outline in this file")
        return
    print(f"  table of contents ({len(entries)}):")
    for depth, title, page in entries[:MAX_HEADINGS]:
        print(f"    {'  ' * depth}- {title}" + (f" (p. {page})" if page else ""))
    if len(entries) > MAX_HEADINGS:
        print(f"    ... {len(entries) - MAX_HEADINGS} more entries not shown")
    exercises = [(t, p) for _, t, p in entries if EXERCISE_RE.search(t)]
    print(f"  exercises by outline keyword ({len(exercises)}):")
    for title, page in exercises[:MAX_HEADINGS]:
        print(f"    - {title}" + (f" (p. {page})" if page else ""))


def main(argv: list[str]) -> int:
    # Windows consoles default to a legacy code page; umlauts in headings must survive.
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if len(argv) != 2:
        print("usage: python inventory.py <materials-dir>", file=sys.stderr)
        return 2
    root = Path(argv[1])
    if not root.is_dir():
        print(f"not a directory: {root}", file=sys.stderr)
        return 2
    notebooks = sorted(p for p in root.rglob("*.ipynb") if ".ipynb_checkpoints" not in p.parts)
    pdfs = sorted(root.rglob("*.pdf"))
    if not notebooks and not pdfs:
        print(f"no materials found in {root}")
        return 0
    print(f"materials in {root}: {len(notebooks)} notebook(s), {len(pdfs)} pdf(s)")
    print()
    for path in notebooks:
        report_notebook(path, root)
        print()
    for path in pdfs:
        report_pdf(path, root)
        print()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
