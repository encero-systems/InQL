# Reference

Reference pages describe IncQL's current public contracts: the carrier model, query and method surfaces, inspection and evidence types, execution context, function catalog, and Substrait boundary. Use these pages when you need an exact API shape or behavioral rule.

## Relational authoring

- [Dataset carriers][dataset-carriers] explains the `DataSet`, `DataFrame`, `LazyFrame`, and `DataStream` type family.
- [Dataset methods][dataset-methods] lists the relational operations shared across authoring styles.
- [Query blocks][query-blocks] defines clauses, expression resolution, aliases, and lowering behavior.
- [Filter builders][filter-builders], [projection builders][projection-builders], and [aggregate builders][aggregate-builders] cover expression construction for each relational operation.

## Inspection and evidence

- [Inspection][inspection] documents structured plan, schema, lineage, requirement, and artifact records available before execution.
- [Quality][quality] defines typed assertions and quality observations.
- [Governance][governance] defines governed attributes and policy checkpoint evidence.

## Execution and interchange

- [Execution context][execution] documents Session construction, registration, execution, collection, writes, and observations.
- [Substrait conformance][substrait] is the entry point for IncQL's portable logical boundary and operator coverage.
- [Function reference][functions] lists declared scalar, aggregate, generator, sketch, formatting, nested, variant, and window functions.

If you are learning the concepts rather than looking up a contract, start with [Learn][learn]. For a task-oriented walkthrough, use the [Guides][guides].

<!-- References -->
[aggregate-builders]: builders/aggregates.md
[dataset-carriers]: dataset_carriers.md
[dataset-methods]: dataset_methods.md
[execution]: execution_context.md
[filter-builders]: builders/filters.md
[functions]: functions/index.md
[governance]: governance.md
[guides]: ../how-to/README.md
[inspection]: inspection.md
[learn]: ../README.md
[quality]: quality.md
[projection-builders]: builders/projections.md
[query-blocks]: query_blocks.md
[substrait]: substrait/conformance.md
