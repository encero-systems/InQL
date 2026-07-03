# InQL language docs

This section documents the current InQL package surface.

- Use [reference/][reference] for API shape, signatures, and current behavior contracts.
- Use [how-to/][how-to] for concrete task workflows.
- Use [explanation/][explanation] for mental models, usage framing, and tradeoffs.

## Current entry points

### Core carriers

- [Dataset carriers (Reference)][dataset-reference]
- [Dataset carriers (Explanation)][dataset-explanation]
- [Query blocks (Reference)][query-blocks-reference]

### Execution and materialization

- [Capture execution observations and adapter coverage (How-to)][execution-observations-how-to]
- [Execution context (Reference)][execution-reference]
- [Execution context (Explanation)][execution-explanation]

### Substrait boundary

- [Substrait read-root and binding contract][substrait-read-root]
- [Substrait conformance][substrait-conformance]
- [Substrait operator catalog][substrait-operator-catalog]
- [Substrait revision and extension policy][substrait-revision-policy]

### Local evidence

- [Local inspection][inspection-reference]

<!-- References -->
[reference]: reference/
[how-to]: how-to/
[explanation]: explanation/
[dataset-reference]: reference/dataset_carriers.md
[dataset-explanation]: explanation/dataset_carriers.md
[query-blocks-reference]: reference/query_blocks.md
[inspection-reference]: reference/inspection.md
[execution-reference]: reference/execution_context.md
[execution-explanation]: explanation/execution_context.md
[execution-observations-how-to]: how-to/execution_observations.md
[substrait-read-root]: reference/substrait/read_root_binding_contract.md
[substrait-conformance]: reference/substrait/conformance.md
[substrait-operator-catalog]: reference/substrait/operator_catalog.md
[substrait-revision-policy]: reference/substrait/revision_and_extension_policy.md
