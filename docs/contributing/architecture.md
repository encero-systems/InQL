# Contributor architecture

This page is the source-level companion to the [conceptual architecture][architecture]. Start with the conceptual page if you want to understand the system boundaries; use this page when you need to find the module that implements one of those boundaries or verify how the package is built.

## Responsibility map

| Layer           | Owns                                                                                                                                                             | Does not own                                                                                  |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Incan compiler  | Generic vocabulary hosting, parsing and typechecking generated Incan, language lowering, Rust emission, language tooling, and the test runner                    | IncQL vocabulary semantics, package contracts, or backend execution policy                    |
| IncQL package   | `query:` and `quality:` vocabulary registration and desugaring, author-facing carriers, relational semantics, inspection, evidence contracts, and normative RFCs | Generic compiler semantics, workflow orchestration, credentials, or engine-specific semantics |
| Prism           | IncQL's immutable internal logical plan state, schema facts, canonical rewrites, lineage, and authored-origin mappings                                           | Public authoring syntax, portable interchange, binding, or execution                          |
| Substrait       | The portable logical `Plan` / `Rel` boundary                                                                                                                     | Credentials, backend selection, or IncQL's complete local evidence model                      |
| Session         | Source registration, logical-name binding, adapter selection, execute/collect/write, runtime observations, and adapter coverage                                  | Redefining authored relational meaning                                                        |
| Backend adapter | Backend-specific planning, lowering, pushdown, execution, and runtime behavior                                                                                   | Becoming the semantic owner of the plan                                                       |

Prism is an internal IncQL component rather than a public authoring surface. `LazyFrame[T]` carries a Prism-native `PrismCursor[T]`; the cursor is not backend-native and Prism is not represented by the IncQL brand mark.

## Package implementation map

| Path                                  | Responsibility                                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `vocab_companion/src/lib.rs`          | IncQL-specific `query:` and `quality:` vocabulary registration and desugaring                     |
| `src/lib.incn`                        | Public package exports                                                                            |
| `src/dataset/mod.incn`                | `DataSet`, `DataFrame`, `LazyFrame`, and `DataStream` carrier types                               |
| `src/dataset/ops.incn`                | Canonical relational operator methods                                                             |
| `src/prism/types.incn`                | Internal authored-node, rewritten-view, and rewrite evidence models                               |
| `src/prism/store.incn`                | Append-only Prism store and structural sharing                                                    |
| `src/prism/rewrite.incn`              | Narrow semantics-preserving canonical rewrites and origin mappings                                |
| `src/prism/lower.incn`                | Lowering a Prism view toward the Substrait boundary                                               |
| `src/substrait/`                      | Schema and expression lowering, relation construction, plan assembly, extensions, and conformance |
| `src/session/types.incn`              | Public Session and SessionBuilder API plus execution and observation flow                         |
| `src/session/backend_dispatch.incn`   | Portable adapter dispatch                                                                         |
| `src/session/datafusion_backend.incn` | Reference DataFusion adapter implementation                                                       |
| `src/inspect.incn`                    | Structured plan inspection, schema flow, lineage, requirements, and artifact summaries            |
| `src/evidence.incn`                   | Semantic targets, lineage, requirements, observations, and evidence records                       |
| `src/governance.incn`                 | Governed attributes and policy checkpoint evidence                                                |
| `src/quality.incn`                    | Typed quality assertions and observations                                                         |
| `src/functions/`                      | Declared scalar, aggregate, generator, and window function surface                                |
| `tests/`                              | Package tests run through `incan test`                                                            |

## End-to-end execution path

1. An author uses a query block or dataset method to extend typed carrier state.
2. A Prism-backed carrier appends immutable authored nodes and retains schema and origin information.
3. Prism may derive a narrow canonical view. The current rewrite set is semantics-preserving and does not introduce cost-based optimization.
4. The selected view lowers to the Substrait logical boundary.
5. Session validates logical reads against registered sources, supplies backend registrations, and dispatches the requested operation to its selected adapter.
6. The adapter performs backend-specific bridging, planning, and execution, then returns a materialization or typed error.
7. Session returns the public result and creates structured execution evidence when the observed API is used.

Plan inspection is a separate read-only path. It can describe plan structure, schema, lineage, metadata, governed attributes, and adapter requirements without registering physical sources or executing a backend. Adapter coverage evaluation is also explicit: callers use `check_plan_coverage(...)`, `check_inspection_coverage(...)`, or `check_coverage(...)` when they need it; observed execution methods do not infer or attach coverage automatically.

## Repository and compiler boundary

The IncQL repository owns the library package, its tests, public documentation, conformance material, and normative RFCs. It deliberately does not contain the Rust compiler implementation.

The [Incan repository][incan] owns the generic vocabulary host, parsing, typechecking, language lowering, Rust emission, language tooling, and the test runner that make IncQL source executable. IncQL-specific `query:` or `quality:` registration and desugaring belong in this repository's `vocab_companion/`; changes to the generic vocabulary mechanism or compiler behavior belong in Incan. Package APIs and relational contracts remain here.

## Build and test

With `incan` on `PATH`, the repository gate is:

```text
make ci
```

The underlying package commands are:

```text
incan build --lib
incan test tests
```

`incan build --lib` is the important compile boundary: it parses, checks, lowers, and emits the Rust crate for the IncQL library. `incan test tests` discovers and runs the package tests under `tests/`.

## Suggested source reading order

1. `vocab_companion/src/lib.rs` for IncQL-specific query and quality desugaring.
2. `src/dataset/mod.incn` for the public carrier model.
3. `src/prism/mod.incn`, `types.incn`, `store.incn`, and `rewrite.incn` for internal planning state.
4. `src/substrait/mod.incn`, `relations.incn`, `plans.incn`, and `expr_lowering.incn` for the portable boundary.
5. `src/session/mod.incn`, `types.incn`, and `backend_dispatch.incn` for runtime ownership.
6. `src/inspect.incn` and `src/evidence.incn` for the cross-cutting evidence model.
7. `src/governance.incn` and `src/quality.incn` for governed and quality evidence.

For API-level behavior, prefer the [Reference][reference] pages. For normative design history and end-state contracts, use the [RFC index][rfcs].

<!-- References -->
[architecture]: ../architecture.md
[incan]: https://github.com/encero-systems/incan
[reference]: ../language/reference/README.md
[rfcs]: ../rfcs/README.md
