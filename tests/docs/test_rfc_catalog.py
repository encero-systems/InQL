from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
from io import StringIO
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from utils.rfc_catalog import (
    BEGIN_MARKER,
    END_MARKER,
    CatalogError,
    build_catalog,
    catalog_data,
    discover_rfc_files,
    load_topic_mapping,
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

    def test_topic_mapping_supports_both_portable_shapes_and_json_files(self) -> None:
        self.write_rfc(0)
        self.write_rfc(1, slug="second")

        by_id = build_catalog(self.rfc_dir, topics={"000": "Language", 1: "Runtime"})
        self.assertEqual([record.topic for record in by_id], ["Language", "Runtime"])

        topic_file = self.rfc_dir.parent / "topics.json"
        topic_file.write_text(
            json.dumps({"Foundations": ["000", "001"]}),
            encoding="utf-8",
        )
        by_topic = build_catalog(self.rfc_dir, topics=topic_file)
        self.assertEqual([record.topic for record in by_topic], ["Foundations", "Foundations"])

    def test_topic_mapping_requires_exactly_one_assignment_per_rfc(self) -> None:
        self.write_rfc(0)
        self.write_rfc(1, slug="second")

        with self.assertRaisesRegex(CatalogError, "missing RFCs: 001"):
            build_catalog(self.rfc_dir, topics={"000": "Language"})
        with self.assertRaisesRegex(CatalogError, "unknown RFCs: 002"):
            build_catalog(
                self.rfc_dir,
                topics={"000": "Language", "001": "Runtime", "002": "Other"},
            )
        with self.assertRaisesRegex(CatalogError, "assigns RFC 000 more than once"):
            load_topic_mapping({"Language": ["000"], "Runtime": [0]})

    def test_catalog_data_and_rendered_block_are_deterministic_and_safe(self) -> None:
        self.write_rfc(0, summary="Avoid </script> termination & preserve safety.")
        self.write_rfc(1, slug="second")
        records = build_catalog(
            self.rfc_dir,
            topics={"000": "Language", "001": "Runtime"},
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
        self.assertTrue(block.startswith(BEGIN_MARKER))
        self.assertTrue(block.endswith(END_MARKER))
        self.assertIn('type="application/json" data-rfc-catalog', block)
        self.assertIn('class="pp-rfc-fallback" data-rfc-fallback markdown="1"', block)
        self.assertNotIn("<noscript", block)
        self.assertNotIn("</script> termination", block)
        self.assertIn(r"\u003c/script\u003e termination \u0026 preserve safety", block)
        self.assertIn("| [000](000_test_rfc.md) | Draft | Language | A test RFC |", block)

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
        topics = self.rfc_dir / "catalog.json"
        topics.write_text(json.dumps({"Foundations": ["000"]}), encoding="utf-8")
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
        self.assertIn("| RFC | Status | Topic | Title |", current)
        self.assertIn("| Draft | Foundations | A test RFC |", current)
        readme.write_text(current.replace("A test RFC", "A stale RFC", 1), encoding="utf-8")
        errors = StringIO()
        with redirect_stdout(StringIO()), redirect_stderr(errors):
            self.assertEqual(main([*arguments, "--check"]), 1)
        self.assertIn("is out of date", errors.getvalue())
        self.assertIn(f"--topics {topics}", errors.getvalue())
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
        records = build_catalog(repository_root / "docs" / "rfcs")

        self.assertEqual(len(records), 50)
        self.assertEqual(records[0].id, "000")
        self.assertEqual(records[-1].id, "050")
        self.assertNotIn("049", {record.id for record in records})


if __name__ == "__main__":
    unittest.main()
