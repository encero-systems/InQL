#!/usr/bin/env python3
"""Generate the InQL RFC index table from RFC markdown files."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RFC_DIR = ROOT / "docs" / "rfcs"
README = RFC_DIR / "README.md"
START = "<!-- BEGIN GENERATED RFC INDEX -->"
END = "<!-- END GENERATED RFC INDEX -->"


@dataclass(frozen=True)
class RfcEntry:
    number: str
    status: str
    title: str
    path: Path


def _escape_table_cell(value: str) -> str:
    return value.replace("|", r"\|")


def _read_entry(path: Path) -> RfcEntry:
    text = path.read_text(encoding="utf-8")
    heading = re.search(r"^# InQL RFC (?P<number>\d{3}): (?P<title>.+)$", text, re.MULTILINE)
    if heading is None:
        raise ValueError(f"{path}: missing '# InQL RFC NNN: ...' heading")

    status = re.search(r"^- \*\*Status:\*\* (?P<status>.+)$", text, re.MULTILINE)
    if status is None:
        raise ValueError(f"{path}: missing '- **Status:** ...' header")

    number = heading.group("number")
    filename_number = path.name.split("_", 1)[0]
    if filename_number != number:
        raise ValueError(f"{path}: filename number {filename_number} does not match heading {number}")

    return RfcEntry(
        number=number,
        status=status.group("status").strip(),
        title=heading.group("title").strip(),
        path=path.relative_to(RFC_DIR),
    )


def _entries() -> list[RfcEntry]:
    entries = [_read_entry(path) for path in sorted(RFC_DIR.glob("[0-9][0-9][0-9]_*.md"))]
    numbers = [entry.number for entry in entries]
    duplicates = sorted({number for number in numbers if numbers.count(number) > 1})
    if duplicates:
        joined = ", ".join(duplicates)
        raise ValueError(f"duplicate RFC number(s): {joined}")
    return entries


def _render_table(entries: list[RfcEntry]) -> str:
    rows = [
        START,
        "",
        "| RFC | Status | Title |",
        "| --- | --- | --- |",
    ]
    for entry in entries:
        rows.append(
            f"| [{entry.number}]({entry.path.as_posix()}) | "
            f"{_escape_table_cell(entry.status)} | "
            f"{_escape_table_cell(entry.title)} |"
        )
    rows.extend(["", END])
    return "\n".join(rows)


def _replace_generated_region(readme: str, generated: str) -> str:
    if START in readme and END in readme:
        before, rest = readme.split(START, 1)
        _, after = rest.split(END, 1)
        return before.rstrip() + "\n\n" + generated + after

    table_match = re.search(
        r"(?ms)^\| RFC\s+\|.*?^<!-- TODO: #7: auto populate this table.*?-->\n",
        readme,
    )
    if table_match is None:
        raise ValueError(f"{README}: missing generated markers and bootstrap table")
    return readme[: table_match.start()].rstrip() + "\n\n" + generated + "\n\n" + readme[table_match.end() :]


def render_readme() -> str:
    current = README.read_text(encoding="utf-8")
    generated = _render_table(_entries())
    return _replace_generated_region(current, generated)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail if docs/rfcs/README.md is stale")
    args = parser.parse_args()

    try:
        rendered = render_readme()
    except ValueError as exc:
        print(exc, file=sys.stderr)
        return 2

    current = README.read_text(encoding="utf-8")
    if args.check:
        if current != rendered:
            print("docs/rfcs/README.md is stale; run `python3 scripts/generate_rfc_index.py`.", file=sys.stderr)
            return 1
        return 0

    README.write_text(rendered, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
