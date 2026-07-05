# InQL language docs

This section documents the current InQL package surface.

- Use [reference/][reference] for API shape, signatures, and current behavior contracts.
- Use [how-to/][how-to] for concrete task workflows.
- Use [explanation/][explanation] for mental models, usage framing, and tradeoffs.

## Current entry points

### Core carriers

- [Build deferred dataset transformations (How-to)][dataset-transformations-how-to]
- [Expand rows with generators (How-to)][generator-rows-how-to]
- [Normalize semi-structured fields (How-to)][normalize-semistructured-fields-how-to]
- [Work with nested row values (How-to)][nested-row-values-how-to]
- [Dataset carriers (Reference)][dataset-reference]
- [Dataset carriers (Explanation)][dataset-explanation]
- [Dataset methods (Reference)][dataset-methods-reference]
- [Query blocks (Reference)][query-blocks-reference]

### Execution and materialization

- [Capture execution observations and adapter coverage (How-to)][execution-observations-how-to]
- [Inspect governed evidence (How-to)][governed-evidence-how-to]
- [Observe data quality checks (How-to)][quality-observations-how-to]
- [Execution context (Reference)][execution-reference]
- [Execution context (Explanation)][execution-explanation]

### Analytical functions

- [Add window columns (How-to)][window-columns-how-to]
- [Estimate approximate metrics (How-to)][approximate-metrics-how-to]
- [Build typed HyperLogLog sketches (How-to)][typed-hll-sketches-how-to]
- [Inspect typed variant payloads (How-to)][variant-payloads-how-to]

### Substrait boundary

- [Substrait read-root and binding contract][substrait-read-root]
- [Substrait conformance][substrait-conformance]
- [Substrait operator catalog][substrait-operator-catalog]
- [Substrait revision and extension policy][substrait-revision-policy]

### Local evidence

- [Inspect a plan and lineage graph (How-to)][inspect-plan-lineage-how-to]
- [Local inspection][inspection-reference]
- [Governed attributes and policy checkpoints][governance-reference]
- [Quality assertions and observations][quality-reference]

<!-- References -->
[reference]: reference/
[how-to]: how-to/
[explanation]: explanation/
[approximate-metrics-how-to]: how-to/approximate_metrics.md
[dataset-reference]: reference/dataset_carriers.md
[dataset-explanation]: explanation/dataset_carriers.md
[dataset-methods-reference]: reference/dataset_methods.md
[dataset-transformations-how-to]: how-to/dataset_transformations.md
[generator-rows-how-to]: how-to/generator_rows.md
[nested-row-values-how-to]: how-to/nested_row_values.md
[normalize-semistructured-fields-how-to]: how-to/normalize_semistructured_fields.md
[query-blocks-reference]: reference/query_blocks.md
[typed-hll-sketches-how-to]: how-to/typed_hll_sketches.md
[variant-payloads-how-to]: how-to/variant_payloads.md
[window-columns-how-to]: how-to/window_columns.md
[inspection-reference]: reference/inspection.md
[execution-reference]: reference/execution_context.md
[execution-explanation]: explanation/execution_context.md
[execution-observations-how-to]: how-to/execution_observations.md
[governed-evidence-how-to]: how-to/governed_evidence.md
[governance-reference]: reference/governance.md
[quality-observations-how-to]: how-to/quality_observations.md
[inspect-plan-lineage-how-to]: how-to/inspect_plan_lineage.md
[quality-reference]: reference/quality.md
[substrait-read-root]: reference/substrait/read_root_binding_contract.md
[substrait-conformance]: reference/substrait/conformance.md
[substrait-operator-catalog]: reference/substrait/operator_catalog.md
[substrait-revision-policy]: reference/substrait/revision_and_extension_policy.md
