# InQL documentation

This directory holds the public documentation for the InQL project.

Use the docs tree like this:

- **Language reference:** current package/API contracts under [language/reference/][language-reference]
- **Language how-to guides:** task-oriented workflows under [language/how-to/][language-how-to]
- **Language explanation:** conceptual guidance and usage framing under [language/explanation/][language-explanation]
- **Architecture:** repository and system boundaries in [architecture.md][architecture]
- **RFCs:** design records and normative proposals in [rfcs/][rfcs]
- **Whitepapers:** broader non-normative design papers in [whitepapers/][whitepapers]
- **Release notes:** shipped and user-visible changes in [release_notes/][release-notes]
- **Contributing:** contributor workflow, especially RFC process, in [contributing/][contributing]

## Recommended reading paths

### Learn the current package surface

1. [Language overview][language-overview]
2. [Dataset carriers (Explanation)][dataset-explanation]
3. [Execution context (Explanation)][execution-explanation]
4. [Build deferred dataset transformations (How-to)][dataset-transformations-how-to]
5. [Normalize semi-structured fields (How-to)][normalize-semistructured-fields-how-to]
6. [Work with nested row values (How-to)][nested-row-values-how-to]
7. [Expand rows with generators (How-to)][generator-rows-how-to]
8. [Add window columns (How-to)][window-columns-how-to]
9. [Capture execution observations and adapter coverage (How-to)][execution-observations-how-to]
10. [Observe data quality checks (How-to)][quality-observations-how-to]
11. [Package a governed plan bundle (How-to)][governed-plan-bundles-how-to]
12. [Compare two plans (How-to)][plan-diffs-how-to]
13. [Exchange evidence locally (How-to)][evidence-exchange-how-to]
14. [Dataset carriers (Reference)][dataset-reference]
15. [Dataset methods (Reference)][dataset-methods-reference]
16. [Execution context (Reference)][execution-reference]
17. [Inspect a plan and lineage graph (How-to)][inspect-plan-lineage-how-to]
18. [Local inspection (Reference)][inspection-reference]

### Understand the system design

1. [InQL architecture][architecture]
2. [RFC index][rfcs-index]
3. Relevant RFCs for deeper normative context

### Work on the spec

1. [RFC index][rfcs-index]
2. [How to write an RFC][writing-rfcs]

> Note: When a standalone docs site is added, `docs/` remains the content root. The structure here should already follow the same content model used in Incan: reference, how-to guides, explanation, architecture/contributing, RFCs, and release notes.

<!-- References -->
[language-reference]: language/reference/
[language-how-to]: language/how-to/
[language-explanation]: language/explanation/
[architecture]: architecture.md
[rfcs]: rfcs/README.md
[whitepapers]: whitepapers/README.md
[release-notes]: release_notes/
[contributing]: contributing/
[language-overview]: language/README.md
[window-columns-how-to]: language/how-to/window_columns.md
[dataset-explanation]: language/explanation/dataset_carriers.md
[execution-explanation]: language/explanation/execution_context.md
[dataset-reference]: language/reference/dataset_carriers.md
[dataset-methods-reference]: language/reference/dataset_methods.md
[dataset-transformations-how-to]: language/how-to/dataset_transformations.md
[generator-rows-how-to]: language/how-to/generator_rows.md
[nested-row-values-how-to]: language/how-to/nested_row_values.md
[normalize-semistructured-fields-how-to]: language/how-to/normalize_semistructured_fields.md
[execution-reference]: language/reference/execution_context.md
[execution-observations-how-to]: language/how-to/execution_observations.md
[quality-observations-how-to]: language/how-to/quality_observations.md
[governed-plan-bundles-how-to]: language/how-to/governed_plan_bundles.md
[plan-diffs-how-to]: language/how-to/plan_diffs.md
[evidence-exchange-how-to]: language/how-to/evidence_exchange.md
[inspect-plan-lineage-how-to]: language/how-to/inspect_plan_lineage.md
[inspection-reference]: language/reference/inspection.md
[rfcs-index]: rfcs/README.md
[writing-rfcs]: contributing/writing_rfcs.md
