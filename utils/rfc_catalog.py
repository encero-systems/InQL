"""Build and validate the portable RFC catalog used by the documentation site.

The module intentionally depends only on the Python standard library.  It can
therefore be copied to another repository without bringing MkDocs (or a MkDocs
plugin) into that repository's validation path.
"""

from __future__ import annotations

import argparse
from collections.abc import Mapping, Sequence
from dataclasses import asdict, dataclass, replace
from datetime import date
import json
from pathlib import Path
import re
import shlex
import sys
from typing import Any
from urllib.parse import urlparse


BEGIN_MARKER = "<!-- BEGIN GENERATED RFC CATALOG -->"
END_MARKER = "<!-- END GENERATED RFC CATALOG -->"

REQUIRED_METADATA = (
    "Status",
    "Created",
    "Author(s)",
    "Related",
    "Issue",
    "RFC PR",
    "Written against",
    "Shipped in",
)

ACTIVE_STATUSES = frozenset({"Draft", "Planned", "In Progress", "Blocked", "Deferred"})
TERMINAL_STATUSES = frozenset({"Implemented", "Superseded", "Rejected", "Withdrawn"})
DEFAULT_PROJECT_LABEL = "IncQL"
ALLOWED_GAPS = frozenset({49})
MAX_TAGS_PER_RECORD = 4

_RFC_FILENAME_RE = re.compile(r"^(?P<id>\d{3})_(?P<slug>[a-z0-9][a-z0-9_]*)\.md$")
_METADATA_RE = re.compile(r"^-\s+\*\*(?P<name>[^*]+?):\*\*\s*(?P<value>.*)$")
_BLOCKED_STATUS_RE = re.compile(r"^Blocked(?:\s+\(.+\))?$")
_MARKDOWN_LINK_RE = re.compile(r"!?\[([^]]*)\]\([^)]+\)")
_MARKDOWN_REFERENCE_LINK_RE = re.compile(r"\[([^]]+)\]\[[^]]*\]")
_METADATA_LINK_RE = re.compile(r"\[([^]]+)\]\((https?://[^\s)]+)\)")
_BARE_URL_RE = re.compile(r"https?://\S+")
_RELATED_RFC_RE = re.compile(r"(?:IncQL\s+)?RFC\s+(\d{3})", flags=re.IGNORECASE)
_TAG_KEY_RE = re.compile(r"^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$")


class CatalogError(ValueError):
    """Raised when the RFC corpus cannot form a valid catalog."""


@dataclass(frozen=True, slots=True)
class CatalogLink:
    """A validated source link exposed without client-side Markdown parsing."""

    label: str
    url: str


@dataclass(frozen=True, slots=True, order=True)
class CatalogTag:
    """One stable tag key and its repository-defined display label.

    RFC records store tags as a sorted tuple of these frozen values.  This
    keeps the Python representation immutable and makes serialized output
    independent of JSON object ordering.
    """

    key: str
    label: str


@dataclass(frozen=True, slots=True)
class RfcRecord:
    """One validated RFC entry, ready for deterministic serialization."""

    id: str
    title: str
    status: str
    status_key: str
    lifecycle: str
    created: str
    authors: str
    related: tuple[str, ...]
    related_ids: tuple[str, ...]
    issue: str
    issue_label: str | None
    issue_url: str | None
    issue_links: tuple[CatalogLink, ...]
    rfc_pr: str
    rfc_pr_label: str | None
    rfc_pr_url: str | None
    rfc_pr_links: tuple[CatalogLink, ...]
    written_against: str
    shipped_in: str
    summary: str
    motivation: str
    source_path: str
    href: str
    tags: tuple[CatalogTag, ...] = ()

    def to_dict(self) -> dict[str, Any]:
        """Return a JSON-compatible representation with stable field names."""

        result = asdict(self)
        result["related"] = list(self.related)
        result["related_ids"] = list(self.related_ids)
        result["issue_links"] = [asdict(link) for link in self.issue_links]
        result["rfc_pr_links"] = [asdict(link) for link in self.rfc_pr_links]
        result["tags"] = [asdict(tag) for tag in self.tags]
        return result


def discover_rfc_files(rfc_dir: Path | str) -> list[Path]:
    """Recursively discover RFC files in deterministic path order.

    Only files following ``NNN_slug.md`` are RFC inputs.  README and TEMPLATE
    documents are consequently excluded even if their names change case.
    """

    root = Path(rfc_dir)
    if not root.is_dir():
        raise CatalogError(f"RFC directory does not exist: {root}")

    files = [
        path
        for path in root.rglob("*.md")
        if path.is_file() and _RFC_FILENAME_RE.fullmatch(path.name)
    ]
    return sorted(files, key=lambda path: path.relative_to(root).as_posix())


def _plain_text(value: str) -> str:
    value = _MARKDOWN_LINK_RE.sub(r"\1", value)
    value = _MARKDOWN_REFERENCE_LINK_RE.sub(r"\1", value)
    value = value.replace("`", "").replace("**", "").replace("__", "")
    return " ".join(value.split())


def _metadata_value(lines: list[str]) -> str:
    cleaned: list[str] = []
    for line in lines:
        value = line.strip()
        if not value:
            continue
        if value.startswith("- "):
            value = value[2:].strip()
        cleaned.append(value)
    return "\n".join(cleaned).strip()


def _parse_metadata(lines: list[str], source: Path) -> dict[str, str]:
    metadata: dict[str, str] = {}
    current_name: str | None = None
    current_lines: list[str] = []

    def commit() -> None:
        nonlocal current_name, current_lines
        if current_name is None:
            return
        if current_name in metadata:
            raise CatalogError(f"{source}: duplicate metadata field {current_name!r}")
        metadata[current_name] = _metadata_value(current_lines)
        current_name = None
        current_lines = []

    for line in lines:
        match = _METADATA_RE.match(line)
        if match:
            commit()
            current_name = match.group("name").strip()
            current_lines = [match.group("value")]
        elif current_name is not None:
            current_lines.append(line)
    commit()

    missing = [name for name in REQUIRED_METADATA if not metadata.get(name, "").strip()]
    if missing:
        fields = ", ".join(missing)
        raise CatalogError(f"{source}: missing required metadata: {fields}")
    return metadata


def _normalise_project_label(value: str) -> str:
    label = " ".join(value.split())
    if not label:
        raise CatalogError("project label must not be empty")
    return label


def _status_kind(status: str, source: Path, project_label: str) -> str:
    if status in ACTIVE_STATUSES or status in TERMINAL_STATUSES:
        return status
    if _BLOCKED_STATUS_RE.fullmatch(status):
        return "Blocked"
    superseded_status_re = re.compile(
        rf"^Superseded(?:\s+by\s+{re.escape(project_label)}\s+RFC\s+\d{{3}})?$"
    )
    if superseded_status_re.fullmatch(status):
        return "Superseded"
    allowed = ", ".join(sorted(ACTIVE_STATUSES | TERMINAL_STATUSES))
    raise CatalogError(f"{source}: unsupported status {status!r}; expected one of: {allowed}")


def _lifecycle_for_path(relative_path: Path, status_kind: str, source: Path) -> str:
    parent = relative_path.parent.as_posix()
    if parent == ".":
        expected = ACTIVE_STATUSES
        lifecycle = "active"
    elif parent == "closed/implemented":
        expected = frozenset({"Implemented"})
        lifecycle = "implemented"
    elif parent == "closed/superseded":
        expected = frozenset({"Superseded"})
        lifecycle = "superseded"
    elif parent == "closed/rejected":
        expected = frozenset({"Rejected", "Withdrawn"})
        lifecycle = "rejected"
    else:
        raise CatalogError(
            f"{source}: unsupported lifecycle folder {parent!r}; "
            "use the RFC root or closed/{implemented,superseded,rejected}"
        )

    if status_kind not in expected:
        allowed = ", ".join(sorted(expected))
        raise CatalogError(
            f"{source}: status {status_kind!r} does not agree with lifecycle folder "
            f"{parent!r} (expected {allowed})"
        )
    return lifecycle


def _parse_related(raw: str) -> tuple[str, ...]:
    if raw.strip() in {"-", "—"}:
        return ()
    values = tuple(_plain_text(line) for line in raw.splitlines() if line.strip())
    return tuple(value for value in values if value not in {"-", "—"})


def _related_ids(raw: str) -> tuple[str, ...]:
    return tuple(dict.fromkeys(_RELATED_RFC_RE.findall(raw)))


def _parse_metadata_links(raw: str, field: str, source: Path) -> tuple[CatalogLink, ...]:
    value = raw.strip()
    if value in {"-", "—"}:
        return ()

    markdown_matches = list(_METADATA_LINK_RE.finditer(value))
    links: list[CatalogLink] = []
    if markdown_matches:
        residual = _METADATA_LINK_RE.sub("", value)
        if "[" in residual or "]" in residual:
            raise CatalogError(f"{source}: {field} contains malformed Markdown link syntax")
        for match in markdown_matches:
            label = _plain_text(match.group(1))
            url = match.group(2)
            if not label:
                raise CatalogError(f"{source}: {field} link label must not be empty")
            parsed = urlparse(url)
            if parsed.scheme not in {"http", "https"} or not parsed.netloc:
                raise CatalogError(f"{source}: {field} contains an invalid URL: {url!r}")
            links.append(CatalogLink(label=label, url=url))
        return tuple(links)

    if _BARE_URL_RE.fullmatch(value):
        parsed = urlparse(value)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            return (CatalogLink(label=value, url=value),)

    raise CatalogError(
        f"{source}: {field} must be a Markdown link, an HTTP(S) URL, or an explicit —/-"
    )


def _parse_section_paragraph(lines: list[str], heading: str, source: Path) -> str:
    try:
        heading_index = next(i for i, line in enumerate(lines) if line.strip() == heading)
    except StopIteration as error:
        raise CatalogError(f"{source}: missing required {heading!r} section") from error

    paragraph: list[str] = []
    for line in lines[heading_index + 1 :]:
        stripped = line.strip()
        if not stripped:
            if paragraph:
                break
            continue
        if stripped.startswith("#"):
            break
        paragraph.append(stripped)

    summary = _plain_text(" ".join(paragraph))
    if not summary:
        raise CatalogError(f"{source}: {heading!r} must start with a paragraph")
    return summary


def parse_rfc(
    path: Path | str,
    rfc_dir: Path | str,
    *,
    project_label: str = DEFAULT_PROJECT_LABEL,
) -> RfcRecord:
    """Parse and validate one RFC file."""

    source = Path(path)
    root = Path(rfc_dir)
    project_label = _normalise_project_label(project_label)
    try:
        relative_path = source.relative_to(root)
    except ValueError as error:
        raise CatalogError(f"RFC is outside the configured RFC directory: {source}") from error

    filename_match = _RFC_FILENAME_RE.fullmatch(source.name)
    if filename_match is None:
        raise CatalogError(f"{source}: RFC filename must match NNN_slug.md")

    lines = source.read_text(encoding="utf-8").splitlines()
    if not lines:
        raise CatalogError(f"{source}: RFC file is empty")
    heading_re = re.compile(
        rf"^#\s+{re.escape(project_label)}\s+RFC\s+"
        r"(?P<id>\d{3}):\s*(?P<title>.+?)\s*$"
    )
    heading_match = heading_re.fullmatch(lines[0])
    if heading_match is None:
        raise CatalogError(
            f"{source}: first line must be '# {project_label} RFC NNN: Title'"
        )

    filename_id = filename_match.group("id")
    heading_id = heading_match.group("id")
    if filename_id != heading_id:
        raise CatalogError(
            f"{source}: filename RFC {filename_id} disagrees with H1 RFC {heading_id}"
        )

    try:
        summary_index = next(i for i, line in enumerate(lines) if line.strip() == "## Summary")
    except StopIteration as error:
        raise CatalogError(f"{source}: missing required '## Summary' section") from error
    metadata = _parse_metadata(lines[1:summary_index], source)

    created = metadata["Created"]
    try:
        parsed_created = date.fromisoformat(created)
    except ValueError as error:
        raise CatalogError(f"{source}: Created must use YYYY-MM-DD, got {created!r}") from error
    if parsed_created.isoformat() != created:
        raise CatalogError(f"{source}: Created must use zero-padded YYYY-MM-DD, got {created!r}")

    authors = _plain_text(metadata["Author(s)"])
    if authors in {"-", "—"}:
        raise CatalogError(f"{source}: Author(s) must name at least one author")

    status = _plain_text(metadata["Status"])
    status_kind = _status_kind(status, source, project_label)
    lifecycle = _lifecycle_for_path(relative_path, status_kind, source)
    title = _plain_text(heading_match.group("title"))
    if not title:
        raise CatalogError(f"{source}: RFC title must not be empty")

    source_path = relative_path.as_posix()
    href = relative_path.with_suffix("").as_posix() + "/"
    related_ids = _related_ids(metadata["Related"])
    issue_links = _parse_metadata_links(metadata["Issue"], "Issue", source)
    rfc_pr_links = _parse_metadata_links(metadata["RFC PR"], "RFC PR", source)
    return RfcRecord(
        id=filename_id,
        title=title,
        status=status,
        status_key=status_kind.lower().replace(" ", "-"),
        lifecycle=lifecycle,
        created=created,
        authors=authors,
        related=_parse_related(metadata["Related"]),
        related_ids=related_ids,
        issue=metadata["Issue"],
        issue_label=issue_links[0].label if issue_links else None,
        issue_url=issue_links[0].url if issue_links else None,
        issue_links=issue_links,
        rfc_pr=metadata["RFC PR"],
        rfc_pr_label=rfc_pr_links[0].label if rfc_pr_links else None,
        rfc_pr_url=rfc_pr_links[0].url if rfc_pr_links else None,
        rfc_pr_links=rfc_pr_links,
        written_against=_plain_text(metadata["Written against"]),
        shipped_in=_plain_text(metadata["Shipped in"]),
        summary=_parse_section_paragraph(lines, "## Summary", source),
        motivation=_parse_section_paragraph(lines, "## Motivation", source),
        source_path=source_path,
        href=href,
    )


def _normalise_rfc_id(value: object, context: str) -> str:
    if isinstance(value, bool):
        raise CatalogError(f"{context}: boolean is not an RFC id")
    text = str(value).strip()
    if not text.isdigit() or len(text) > 3:
        raise CatalogError(f"{context}: RFC id must be a number from 000 to 999, got {value!r}")
    return f"{int(text):03d}"


def load_tag_mapping(
    source: Mapping[object, object] | Path | str,
) -> dict[str, tuple[CatalogTag, ...]]:
    """Load a controlled many-to-many RFC tag catalog.

    The configuration shape is ``{"definitions": {key: label}, "records":
    {rfc_id: [key, ...]}}``.  A path is interpreted as a UTF-8 JSON file.
    Returned record tags are frozen tuples sorted by stable key.
    """

    raw: object
    if isinstance(source, Mapping):
        raw = source
    else:
        path = Path(source)
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise CatalogError(f"could not load tag catalog {path}: {error}") from error

    if not isinstance(raw, Mapping):
        raise CatalogError("tag catalog must be a JSON object or a mapping")

    expected_sections = {"definitions", "records"}
    section_names = set(raw)
    missing_sections = sorted(expected_sections - section_names)
    unknown_sections = sorted(str(name) for name in section_names - expected_sections)
    if missing_sections or unknown_sections:
        problems: list[str] = []
        if missing_sections:
            problems.append("missing section(s): " + ", ".join(missing_sections))
        if unknown_sections:
            problems.append("unknown section(s): " + ", ".join(unknown_sections))
        raise CatalogError("tag catalog has " + "; ".join(problems))

    raw_definitions = raw["definitions"]
    raw_records = raw["records"]
    if not isinstance(raw_definitions, Mapping):
        raise CatalogError("tag catalog definitions must be a JSON object or a mapping")
    if not isinstance(raw_records, Mapping):
        raise CatalogError("tag catalog records must be a JSON object or a mapping")

    definitions: dict[str, CatalogTag] = {}
    label_to_key: dict[str, str] = {}
    for raw_key, raw_label in raw_definitions.items():
        if not isinstance(raw_key, str) or not _TAG_KEY_RE.fullmatch(raw_key):
            raise CatalogError(
                "tag key must use lowercase kebab-case and start with a letter, "
                f"got {raw_key!r}"
            )
        if not isinstance(raw_label, str) or not raw_label.strip():
            raise CatalogError(f"tag definition {raw_key!r} must have a non-empty label")
        label = " ".join(raw_label.split())
        normalised_label = label.casefold()
        if normalised_label in label_to_key:
            other_key = label_to_key[normalised_label]
            raise CatalogError(
                f"tag definitions {other_key!r} and {raw_key!r} have duplicate label {label!r}"
            )
        label_to_key[normalised_label] = raw_key
        definitions[raw_key] = CatalogTag(raw_key, label)

    id_to_tags: dict[str, tuple[CatalogTag, ...]] = {}
    for raw_id, raw_tag_keys in raw_records.items():
        rfc_id = _normalise_rfc_id(raw_id, "tag catalog records")
        if rfc_id in id_to_tags:
            raise CatalogError(f"tag catalog defines RFC {rfc_id} more than once")
        if not isinstance(raw_tag_keys, Sequence) or isinstance(
            raw_tag_keys, (str, bytes, bytearray)
        ):
            raise CatalogError(f"tag catalog: RFC {rfc_id} tags must be an array")
        if not raw_tag_keys:
            raise CatalogError(f"tag catalog: RFC {rfc_id} must have at least one tag")
        if len(raw_tag_keys) > MAX_TAGS_PER_RECORD:
            raise CatalogError(
                f"tag catalog: RFC {rfc_id} has more than {MAX_TAGS_PER_RECORD} tags"
            )

        seen_keys: set[str] = set()
        record_tags: list[CatalogTag] = []
        for raw_key in raw_tag_keys:
            if not isinstance(raw_key, str):
                raise CatalogError(f"tag catalog: RFC {rfc_id} has a non-string tag key")
            if raw_key in seen_keys:
                raise CatalogError(
                    f"tag catalog: RFC {rfc_id} contains duplicate tag {raw_key!r}"
                )
            seen_keys.add(raw_key)
            try:
                record_tags.append(definitions[raw_key])
            except KeyError as error:
                raise CatalogError(
                    f"tag catalog: RFC {rfc_id} references unknown tag {raw_key!r}"
                ) from error
        id_to_tags[rfc_id] = tuple(sorted(record_tags))

    return dict(sorted(id_to_tags.items()))


def _validate_sequence(records: list[RfcRecord], allowed_gaps: frozenset[int]) -> None:
    if not records:
        return
    numbers = {int(record.id) for record in records}
    missing = sorted(set(range(min(numbers), max(numbers) + 1)) - numbers - set(allowed_gaps))
    if missing:
        formatted = ", ".join(f"{number:03d}" for number in missing)
        raise CatalogError(f"RFC sequence has unexpected gap(s): {formatted}")


def build_catalog(
    rfc_dir: Path | str,
    *,
    tags: Mapping[object, object] | Path | str | None = None,
    allowed_gaps: frozenset[int] = ALLOWED_GAPS,
    project_label: str = DEFAULT_PROJECT_LABEL,
) -> list[RfcRecord]:
    """Discover, validate, and return RFCs sorted by numeric id."""

    root = Path(rfc_dir)
    project_label = _normalise_project_label(project_label)
    records = [
        parse_rfc(path, root, project_label=project_label)
        for path in discover_rfc_files(root)
    ]
    records.sort(key=lambda record: int(record.id))

    seen: dict[str, str] = {}
    for record in records:
        if record.id in seen:
            raise CatalogError(
                f"duplicate RFC id {record.id}: {seen[record.id]} and {record.source_path}"
            )
        seen[record.id] = record.source_path
    _validate_sequence(records, allowed_gaps)

    discovered_ids = set(seen)
    for record in records:
        unknown_related = sorted(set(record.related_ids) - discovered_ids)
        if unknown_related:
            formatted = ", ".join(unknown_related)
            raise CatalogError(
                f"{record.source_path}: Related references unknown RFC id(s): {formatted}"
            )

    if tags is not None:
        tag_mapping = load_tag_mapping(tags)
        discovered = discovered_ids
        assigned = set(tag_mapping)
        missing = sorted(discovered - assigned)
        unknown = sorted(assigned - discovered)
        problems: list[str] = []
        if missing:
            problems.append("missing RFCs: " + ", ".join(missing))
        if unknown:
            problems.append("unknown RFCs: " + ", ".join(unknown))
        if problems:
            details = "; ".join(problems)
            raise CatalogError(
                f"tag catalog must assign at least one tag to every discovered RFC ({details})"
            )
        records = [replace(record, tags=tag_mapping[record.id]) for record in records]

    return records


def catalog_data(records: Sequence[RfcRecord]) -> list[dict[str, Any]]:
    """Convert records to deterministic JSON-compatible catalog objects."""

    return [record.to_dict() for record in sorted(records, key=lambda record: int(record.id))]


def _escape_table_cell(value: str) -> str:
    return value.replace("|", "\\|").replace("\n", " ")


def render_index_block(records: Sequence[RfcRecord]) -> str:
    """Render generated JSON data and an accessible Markdown-table fallback."""

    ordered = sorted(records, key=lambda record: int(record.id))
    payload = json.dumps(catalog_data(ordered), ensure_ascii=False, indent=2, sort_keys=True)
    # Source prose containing an HTML end tag must not be able to close the script.
    payload = payload.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    with_tags = any(record.tags for record in ordered)

    lines = [
        BEGIN_MARKER,
        '<script type="application/json" data-rfc-catalog>',
        payload,
        "</script>",
        "",
        '<div class="pp-rfc-fallback" data-rfc-fallback markdown="1">',
        "",
    ]
    if with_tags:
        lines.extend(("| RFC | Status | Tags | Title |", "| ---: | --- | --- | --- |"))
    else:
        lines.extend(("| RFC | Status | Title |", "| ---: | --- | --- |"))

    for record in ordered:
        rfc_link = f"[{record.id}]({record.source_path})"
        status = _escape_table_cell(record.status)
        title = _escape_table_cell(record.title)
        if with_tags:
            tag_labels = _escape_table_cell(", ".join(tag.label for tag in record.tags))
            lines.append(f"| {rfc_link} | {status} | {tag_labels} | {title} |")
        else:
            lines.append(f"| {rfc_link} | {status} | {title} |")

    lines.extend(("", "</div>", END_MARKER))
    return "\n".join(lines)


def replace_generated_block(readme_text: str, generated_block: str) -> str:
    """Replace the single marked generated region in an RFC README."""

    begin_count = readme_text.count(BEGIN_MARKER)
    end_count = readme_text.count(END_MARKER)
    if begin_count != 1 or end_count != 1:
        raise CatalogError(
            "README must contain exactly one generated RFC catalog marker pair: "
            f"{BEGIN_MARKER} ... {END_MARKER}"
        )
    begin = readme_text.index(BEGIN_MARKER)
    try:
        end = readme_text.index(END_MARKER, begin) + len(END_MARKER)
    except ValueError as error:
        raise CatalogError("README RFC catalog end marker must follow its begin marker") from error
    return readme_text[:begin] + generated_block + readme_text[end:]


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Validate and generate the RFC catalog")
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument("--write", action="store_true", help="update the marked README block")
    action.add_argument("--check", action="store_true", help="fail if the README block is stale")
    parser.add_argument("--rfc-dir", type=Path, help="RFC directory (defaults to docs/rfcs)")
    parser.add_argument("--readme", type=Path, help="README containing generated markers")
    parser.add_argument(
        "--tags",
        type=Path,
        help="JSON tag catalog (defaults to catalog.json beside the RFC README when present)",
    )
    parser.add_argument(
        "--project-label",
        default=DEFAULT_PROJECT_LABEL,
        help=f"project name used in RFC H1 headings (default: {DEFAULT_PROJECT_LABEL})",
    )
    gaps = parser.add_mutually_exclusive_group()
    gaps.add_argument(
        "--allow-gap",
        "--allowed-gap",
        dest="allowed_gaps",
        action="append",
        type=_rfc_number,
        metavar="NNN",
        help="allowed missing RFC number; repeat for multiple gaps",
    )
    gaps.add_argument(
        "--no-allowed-gaps",
        action="store_true",
        help="require an unbroken RFC number sequence",
    )
    return parser


def _rfc_number(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("RFC number must be an integer from 000 to 999") from error
    if number < 0 or number > 999:
        raise argparse.ArgumentTypeError("RFC number must be an integer from 000 to 999")
    return number


def _write_remediation(
    args: argparse.Namespace,
    *,
    rfc_dir: Path,
    readme: Path,
    tags: Path | None,
    allowed_gaps: frozenset[int],
) -> str:
    uses_repository_defaults = (
        args.rfc_dir is None
        and args.readme is None
        and args.tags is None
        and args.project_label == DEFAULT_PROJECT_LABEL
        and args.allowed_gaps is None
        and not args.no_allowed_gaps
    )
    if uses_repository_defaults:
        return "make rfc-index"

    command = [
        "python3",
        "utils/rfc_catalog.py",
        "--rfc-dir",
        str(rfc_dir),
        "--readme",
        str(readme),
    ]
    if tags is not None:
        command.extend(("--tags", str(tags)))
    if args.project_label != DEFAULT_PROJECT_LABEL:
        command.extend(("--project-label", args.project_label))
    if allowed_gaps != ALLOWED_GAPS:
        if allowed_gaps:
            for number in sorted(allowed_gaps):
                command.extend(("--allow-gap", f"{number:03d}"))
        else:
            command.append("--no-allowed-gaps")
    command.append("--write")
    return shlex.join(command)


def main(argv: Sequence[str] | None = None) -> int:
    """Run the catalog command-line interface."""

    args = _parser().parse_args(argv)
    repository_root = Path(__file__).resolve().parents[1]
    rfc_dir = args.rfc_dir or repository_root / "docs" / "rfcs"
    readme = args.readme or rfc_dir / "README.md"
    tags = args.tags
    default_tags = rfc_dir / "catalog.json"
    if tags is None and default_tags.is_file():
        tags = default_tags
    if args.no_allowed_gaps:
        allowed_gaps = frozenset()
    elif args.allowed_gaps is not None:
        allowed_gaps = frozenset(args.allowed_gaps)
    else:
        allowed_gaps = ALLOWED_GAPS
    try:
        records = build_catalog(
            rfc_dir,
            tags=tags,
            allowed_gaps=allowed_gaps,
            project_label=args.project_label,
        )
        block = render_index_block(records)
        current = readme.read_text(encoding="utf-8")
        expected = replace_generated_block(current, block)
    except (CatalogError, OSError) as error:
        print(f"rfc catalog: error: {error}", file=sys.stderr)
        return 2

    if args.check:
        if current != expected:
            remediation = _write_remediation(
                args,
                rfc_dir=rfc_dir,
                readme=readme,
                tags=tags,
                allowed_gaps=allowed_gaps,
            )
            print(
                f"rfc catalog: {readme} is out of date; run `{remediation}`",
                file=sys.stderr,
            )
            return 1
        return 0

    if current != expected:
        readme.write_text(expected, encoding="utf-8")
        print(f"rfc catalog: updated {readme}")
    else:
        print(f"rfc catalog: {readme} is already up to date")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
