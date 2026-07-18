from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
from dataclasses import FrozenInstanceError
from io import StringIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from utils.rfc_catalog import (
    BEGIN_MARKER,
    END_MARKER,
    CatalogTag,
    CatalogError,
    build_catalog,
    catalog_data,
    discover_rfc_files,
    load_tag_mapping,
    main,
    parse_rfc,
    render_index_block,
    replace_generated_block,
)


def rfc_text(
    number: int,
    *,
    project_label: str = "IncQL",
    title: str = "A test RFC",
    status: str = "Draft",
    created: str = "2026-07-18",
    related: str = "—",
    issue: str = "[IncQL #1](https://example.test/issues/1)",
    rfc_pr: str = "—",
    summary: str = "A concise summary of the proposed behavior.",
    motivation: str = "This matters because the current behavior is incomplete.",
) -> str:
    return f"""# {project_label} RFC {number:03d}: {title}

- **Status:** {status}
- **Created:** {created}
- **Author(s):** Test Author (@test)
- **Related:** {related}
- **Issue:** {issue}
- **RFC PR:** {rfc_pr}
- **Written against:** Incan v0.4
- **Shipped in:** —

## Summary

{summary}

## Motivation

{motivation}
"""


class RfcCatalogTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary_directory = TemporaryDirectory()
        self.addCleanup(self.temporary_directory.cleanup)
        self.rfc_dir = Path(self.temporary_directory.name) / "rfcs"
        self.rfc_dir.mkdir()

    def write_rfc(
        self,
        number: int,
        *,
        directory: str = "",
        slug: str = "test_rfc",
        **text_options: str,
    ) -> Path:
        parent = self.rfc_dir / directory
        parent.mkdir(parents=True, exist_ok=True)
        path = parent / f"{number:03d}_{slug}.md"
        path.write_text(rfc_text(number, **text_options), encoding="utf-8")
        return path

    def test_discovers_recursively_and_excludes_non_rfc_documents(self) -> None:
        first = self.write_rfc(0)
        implemented = self.write_rfc(
            1,
            directory="closed/implemented",
            slug="implemented",
            status="Implemented",
        )
        (self.rfc_dir / "README.md").write_text("# RFCs\n", encoding="utf-8")
        (self.rfc_dir / "TEMPLATE.md").write_text("# Template\n", encoding="utf-8")
        (self.rfc_dir / "notes.md").write_text("# Notes\n", encoding="utf-8")

        self.assertEqual(discover_rfc_files(self.rfc_dir), [first, implemented])
        records = build_catalog(self.rfc_dir)

        self.assertEqual([record.id for record in records], ["000", "001"])
        self.assertEqual(records[0].lifecycle, "active")
        self.assertEqual(records[1].lifecycle, "implemented")
        self.assertEqual(records[1].href, "closed/implemented/001_implemented/")

    def test_parses_metadata_related_items_and_first_summary_paragraph(self) -> None:
        path = self.write_rfc(
            0,
            title="`query {}` blocks",
            related="\n  - IncQL RFC 001 (`DataSet[T]`)\n  - IncQL RFC 002 (Substrait)",
            summary=(
                "The **typed** query surface spans\n"
                "multiple source lines.\n\nA second paragraph."
            ),
        )

        record = parse_rfc(path, self.rfc_dir)

        self.assertEqual(record.title, "query {} blocks")
        self.assertEqual(record.authors, "Test Author (@test)")
        self.assertEqual(
            record.related,
            ("IncQL RFC 001 (DataSet[T])", "IncQL RFC 002 (Substrait)"),
        )
        self.assertEqual(record.related_ids, ("001", "002"))
        self.assertEqual(record.issue_label, "IncQL #1")
        self.assertEqual(record.issue_url, "https://example.test/issues/1")
        self.assertEqual(record.summary, "The typed query surface spans multiple source lines.")
        self.assertEqual(
            record.motivation,
            "This matters because the current behavior is incomplete.",
        )

    def test_allows_the_deliberate_049_gap(self) -> None:
        self.write_rfc(48, slug="before_gap")
        self.write_rfc(50, slug="after_gap")

        self.assertEqual([record.id for record in build_catalog(self.rfc_dir)], ["048", "050"])

    def test_project_label_and_allowed_gaps_are_configurable(self) -> None:
        self.write_rfc(0, project_label="Incan")
        self.write_rfc(2, slug="after_gap", project_label="Incan")

        with self.assertRaisesRegex(
            CatalogError,
            "first line must be '# IncQL RFC NNN: Title'",
        ):
            build_catalog(self.rfc_dir, allowed_gaps=frozenset({1}))

        records = build_catalog(
            self.rfc_dir,
            project_label="Incan",
            allowed_gaps=frozenset({1}),
        )
        self.assertEqual([record.id for record in records], ["000", "002"])

    def test_rejects_an_unexpected_sequence_gap(self) -> None:
        self.write_rfc(0)
        self.write_rfc(2, slug="unexpected_gap")

        with self.assertRaisesRegex(CatalogError, r"unexpected gap\(s\): 001"):
            build_catalog(self.rfc_dir)

    def test_rejects_duplicate_ids_across_lifecycle_folders(self) -> None:
        self.write_rfc(0, slug="active")
        self.write_rfc(
            0,
            directory="closed/implemented",
            slug="done",
            status="Implemented",
        )

        with self.assertRaisesRegex(CatalogError, "duplicate RFC id 000"):
            build_catalog(self.rfc_dir)

    def test_rejects_filename_and_h1_disagreement(self) -> None:
        path = self.write_rfc(0)
        path.write_text(rfc_text(1), encoding="utf-8")

        with self.assertRaisesRegex(CatalogError, "filename RFC 000 disagrees with H1 RFC 001"):
            parse_rfc(path, self.rfc_dir)

    def test_rejects_missing_metadata_and_invalid_created_date(self) -> None:
        path = self.write_rfc(0)
        path.write_text(
            rfc_text(0).replace("- **RFC PR:** —\n", ""),
            encoding="utf-8",
        )
        with self.assertRaisesRegex(CatalogError, "missing required metadata: RFC PR"):
            parse_rfc(path, self.rfc_dir)

        path.write_text(rfc_text(0, created="18-07-2026"), encoding="utf-8")
        with self.assertRaisesRegex(CatalogError, "Created must use YYYY-MM-DD"):
            parse_rfc(path, self.rfc_dir)

    def test_requires_a_source_derived_motivation_paragraph(self) -> None:
        path = self.write_rfc(0, motivation="")

        with self.assertRaisesRegex(CatalogError, "'## Motivation' must start with a paragraph"):
            parse_rfc(path, self.rfc_dir)

    def test_rejects_unknown_status_and_lifecycle_mismatch(self) -> None:
        path = self.write_rfc(0, status="Accepted")
        with self.assertRaisesRegex(CatalogError, "unsupported status 'Accepted'"):
            parse_rfc(path, self.rfc_dir)

        path.write_text(rfc_text(0, status="Implemented"), encoding="utf-8")
        with self.assertRaisesRegex(CatalogError, "does not agree with lifecycle folder"):
            parse_rfc(path, self.rfc_dir)

    def test_accepts_documented_status_variants_in_matching_folders(self) -> None:
        blocked = self.write_rfc(0, status="Blocked (by RFC 001)")
        superseded = self.write_rfc(
            1,
            directory="closed/superseded",
            status="Superseded by IncQL RFC 002",
        )

        self.assertEqual(parse_rfc(blocked, self.rfc_dir).status_key, "blocked")
        self.assertEqual(parse_rfc(superseded, self.rfc_dir).lifecycle, "superseded")

    def test_custom_project_label_applies_to_superseded_status(self) -> None:
        superseded = self.write_rfc(
            0,
            directory="closed/superseded",
            status="Superseded by Incan RFC 001",
            project_label="Incan",
        )

        record = parse_rfc(superseded, self.rfc_dir, project_label="Incan")
        self.assertEqual(record.status_key, "superseded")

    def test_normalizes_all_source_links_and_rejects_malformed_links(self) -> None:
        path = self.write_rfc(
            0,
            rfc_pr=(
                "[IncQL #10](https://example.test/pull/10); "
                "[IncQL #11](https://example.test/pull/11) (follow-up)"
            ),
        )

        record = parse_rfc(path, self.rfc_dir)
        self.assertEqual(record.rfc_pr_label, "IncQL #10")
        self.assertEqual(record.rfc_pr_url, "https://example.test/pull/10")
        self.assertEqual(
            [(link.label, link.url) for link in record.rfc_pr_links],
            [
                ("IncQL #10", "https://example.test/pull/10"),
                ("IncQL #11", "https://example.test/pull/11"),
            ],
        )

        path.write_text(rfc_text(0, issue="[broken](not-a-url)"), encoding="utf-8")
        with self.assertRaisesRegex(CatalogError, "Issue must be a Markdown link"):
            parse_rfc(path, self.rfc_dir)

    def test_validates_related_ids_against_the_discovered_corpus(self) -> None:
        self.write_rfc(0, related="IncQL RFC 001 (missing)")

        with self.assertRaisesRegex(CatalogError, r"Related references unknown RFC id\(s\): 001"):
            build_catalog(self.rfc_dir)

    def tag_catalog(
        self,
        records: dict[object, list[object]],
        *,
        definitions: dict[object, object] | None = None,
    ) -> dict[str, object]:
        return {
            "definitions": definitions
            or {
                "authoring": "Authoring",
                "planning": "Planning",
                "runtime": "Runtime",
            },
            "records": records,
        }

    def test_tag_catalog_supports_many_to_many_assignments_and_json_files(self) -> None:
        self.write_rfc(0)
        self.write_rfc(1, slug="second")

        tags = build_catalog(
            self.rfc_dir,
            tags=self.tag_catalog(
                {
                    "000": ["planning", "authoring"],
                    1: ["runtime"],
                }
            ),
        )
        self.assertEqual(
            tags[0].tags,
            (
                CatalogTag(key="authoring", label="Authoring"),
                CatalogTag(key="planning", label="Planning"),
            ),
        )
        self.assertEqual(tags[1].tags, (CatalogTag(key="runtime", label="Runtime"),))
        self.assertIsInstance(tags[0].tags, tuple)
        with self.assertRaises(FrozenInstanceError):
            tags[0].tags[0].label = "Changed"  # type: ignore[misc]

        tag_file = self.rfc_dir.parent / "tags.json"
        tag_file.write_text(
            json.dumps(self.tag_catalog({"000": ["authoring"], "001": ["runtime"]})),
            encoding="utf-8",
        )
        from_file = build_catalog(self.rfc_dir, tags=tag_file)
        self.assertEqual(
            [[tag.key for tag in record.tags] for record in from_file],
            [["authoring"], ["runtime"]],
        )

    def test_tag_catalog_requires_every_discovered_rfc_and_rejects_unknown_rfcs(self) -> None:
        self.write_rfc(0)
        self.write_rfc(1, slug="second")

        with self.assertRaisesRegex(CatalogError, "missing RFCs: 001"):
            build_catalog(self.rfc_dir, tags=self.tag_catalog({"000": ["planning"]}))
        with self.assertRaisesRegex(CatalogError, "unknown RFCs: 002"):
            build_catalog(
                self.rfc_dir,
                tags=self.tag_catalog(
                    {
                        "000": ["planning"],
                        "001": ["runtime"],
                        "002": ["authoring"],
                    }
                ),
            )

    def test_tag_catalog_validates_sections_definitions_and_stable_keys(self) -> None:
        with self.assertRaisesRegex(CatalogError, "missing section.*records"):
            load_tag_mapping({"definitions": {"planning": "Planning"}})
        with self.assertRaisesRegex(CatalogError, "unknown section.*topics"):
            load_tag_mapping(
                {"definitions": {}, "records": {}, "topics": {}}  # type: ignore[dict-item]
            )
        with self.assertRaisesRegex(CatalogError, "definitions must be a JSON object"):
            load_tag_mapping({"definitions": [], "records": {}})
        with self.assertRaisesRegex(CatalogError, "records must be a JSON object"):
            load_tag_mapping({"definitions": {}, "records": []})
        with self.assertRaisesRegex(CatalogError, "lowercase kebab-case"):
            load_tag_mapping(self.tag_catalog({}, definitions={"Data Access": "Data access"}))
        with self.assertRaisesRegex(CatalogError, "non-empty label"):
            load_tag_mapping(self.tag_catalog({}, definitions={"planning": "  "}))
        with self.assertRaisesRegex(CatalogError, "duplicate label 'planning'"):
            load_tag_mapping(
                self.tag_catalog(
                    {},
                    definitions={"planning": "Planning", "plan": "  planning  "},
                )
            )

    def test_tag_catalog_rejects_invalid_record_tag_sets(self) -> None:
        with self.assertRaisesRegex(CatalogError, "must have at least one tag"):
            load_tag_mapping(self.tag_catalog({"000": []}))
        with self.assertRaisesRegex(CatalogError, "tags must be an array"):
            load_tag_mapping(self.tag_catalog({"000": "planning"}))  # type: ignore[dict-item]
        with self.assertRaisesRegex(CatalogError, "non-string tag key"):
            load_tag_mapping(self.tag_catalog({"000": [1]}))
        with self.assertRaisesRegex(CatalogError, "duplicate tag 'planning'"):
            load_tag_mapping(self.tag_catalog({"000": ["planning", "planning"]}))
        with self.assertRaisesRegex(CatalogError, "more than 4 tags"):
            load_tag_mapping(
                self.tag_catalog(
                    {"000": ["one", "two", "three", "four", "five"]},
                    definitions={
                        "one": "One",
                        "two": "Two",
                        "three": "Three",
                        "four": "Four",
                        "five": "Five",
                    },
                )
            )
        with self.assertRaisesRegex(CatalogError, "unknown tag 'unknown'"):
            load_tag_mapping(self.tag_catalog({"000": ["unknown"]}))
        with self.assertRaisesRegex(CatalogError, "defines RFC 000 more than once"):
            load_tag_mapping(self.tag_catalog({"0": ["planning"], "000": ["runtime"]}))

    def test_catalog_data_and_rendered_block_are_deterministic_and_safe(self) -> None:
        self.write_rfc(0, summary="Avoid </script> termination & preserve safety.")
        self.write_rfc(1, slug="second")
        records = build_catalog(
            self.rfc_dir,
            tags=self.tag_catalog(
                {
                    "000": ["planning", "authoring"],
                    "001": ["runtime"],
                }
            ),
        )

        data = catalog_data(reversed(records))
        block = render_index_block(reversed(records))

        self.assertEqual([item["id"] for item in data], ["000", "001"])
        self.assertIsInstance(data[0]["related"], list)
        self.assertIsInstance(data[0]["related_ids"], list)
        self.assertEqual(
            data[0]["issue_links"],
            [{"label": "IncQL #1", "url": "https://example.test/issues/1"}],
        )
        self.assertEqual(
            data[0]["tags"],
            [
                {"key": "authoring", "label": "Authoring"},
                {"key": "planning", "label": "Planning"},
            ],
        )
        self.assertTrue(block.startswith(BEGIN_MARKER))
        self.assertTrue(block.endswith(END_MARKER))
        self.assertIn('type="application/json" data-rfc-catalog', block)
        self.assertIn('class="pp-rfc-fallback" data-rfc-fallback markdown="1"', block)
        self.assertNotIn("<noscript", block)
        self.assertNotIn("</script> termination", block)
        self.assertIn(r"\u003c/script\u003e termination \u0026 preserve safety", block)
        self.assertIn(
            "| [000](000_test_rfc.md) | Draft | Authoring, Planning | A test RFC |",
            block,
        )

    def test_replaces_exactly_one_generated_marker_pair(self) -> None:
        original = f"Before\n\n{BEGIN_MARKER}\nold\n{END_MARKER}\n\nAfter\n"
        generated = f"{BEGIN_MARKER}\nnew\n{END_MARKER}"

        self.assertEqual(
            replace_generated_block(original, generated),
            f"Before\n\n{generated}\n\nAfter\n",
        )
        with self.assertRaisesRegex(CatalogError, "exactly one"):
            replace_generated_block("No markers", generated)
        with self.assertRaisesRegex(CatalogError, "end marker must follow"):
            replace_generated_block(f"{END_MARKER}\n{BEGIN_MARKER}", generated)

    def test_cli_write_and_check_share_the_same_generated_output(self) -> None:
        self.write_rfc(0)
        tags = self.rfc_dir / "catalog.json"
        tags.write_text(
            json.dumps(self.tag_catalog({"000": ["planning", "authoring"]})),
            encoding="utf-8",
        )
        readme = self.rfc_dir / "README.md"
        readme.write_text(
            f"# RFCs\n\n{BEGIN_MARKER}\nstale\n{END_MARKER}\n",
            encoding="utf-8",
        )
        arguments = ["--rfc-dir", str(self.rfc_dir), "--readme", str(readme)]

        with redirect_stdout(StringIO()), redirect_stderr(StringIO()):
            self.assertEqual(main([*arguments, "--write"]), 0)
            self.assertEqual(main([*arguments, "--check"]), 0)

        current = readme.read_text(encoding="utf-8")
        self.assertIn("| RFC | Status | Tags | Title |", current)
        self.assertIn("| Draft | Authoring, Planning | A test RFC |", current)
        readme.write_text(current.replace("A test RFC", "A stale RFC", 1), encoding="utf-8")
        errors = StringIO()
        with redirect_stdout(StringIO()), redirect_stderr(errors):
            self.assertEqual(main([*arguments, "--check"]), 1)
        self.assertIn("is out of date", errors.getvalue())
        self.assertIn(f"--tags {tags}", errors.getvalue())
        self.assertIn("--write", errors.getvalue())
        self.assertNotIn("python utils/rfc_catalog.py --write", errors.getvalue())

    def test_cli_accepts_custom_project_label_and_sequence_gaps(self) -> None:
        self.write_rfc(0, project_label="Incan")
        self.write_rfc(2, slug="after_gap", project_label="Incan")
        readme = self.rfc_dir / "README.md"
        readme.write_text(
            f"# RFCs\n\n{BEGIN_MARKER}\nstale\n{END_MARKER}\n",
            encoding="utf-8",
        )

        arguments = [
            "--rfc-dir",
            str(self.rfc_dir),
            "--readme",
            str(readme),
            "--project-label",
            "Incan",
            "--allow-gap",
            "001",
            "--write",
        ]
        with redirect_stdout(StringIO()), redirect_stderr(StringIO()):
            self.assertEqual(main(arguments), 0)

        self.assertIn("| [002]", readme.read_text(encoding="utf-8"))

    def test_current_incql_corpus_satisfies_the_catalog_contract(self) -> None:
        repository_root = Path(__file__).resolve().parents[2]
        records = build_catalog(
            repository_root / "docs" / "rfcs",
            tags=repository_root / "docs" / "rfcs" / "catalog.json",
        )

        self.assertEqual(len(records), 50)
        self.assertEqual(records[0].id, "000")
        self.assertEqual(records[-1].id, "050")
        self.assertNotIn("049", {record.id for record in records})
        self.assertTrue(all(1 <= len(record.tags) <= 4 for record in records))


if __name__ == "__main__":
    unittest.main()
