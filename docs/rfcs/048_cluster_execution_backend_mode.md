# IncQL RFC 048: Cluster execution backend mode

- **Status:** Draft
- **Created:** 2026-07-05
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - IncQL RFC 001 (dataset types and execution backend boundary)
  - IncQL RFC 002 (Apache Substrait integration)
  - IncQL RFC 004 (execution context)
  - IncQL RFC 007 (Prism planning engine)
  - IncQL RFC 008 (optimizer boundary, statistics, CBO, and adaptive execution)
  - IncQL RFC 032 (execution observations)
  - IncQL RFC 033 (adapter requirements and coverage)
  - IncQL RFC 041 (Prism plan ingress and external client frontends)
- **Issue:** —
- **RFC PR:** —
- **Written against:** Incan 0.4.0-rc3 and IncQL's v0.3-era package migration context
- **Shipped in:** —

## Summary

This RFC defines cluster execution as a backend mode of IncQL's existing `Session` execution boundary. Cluster mode must not create a second IncQL semantic model: authors still produce typed IncQL logical plans, Prism and Substrait remain the logical boundary, and backend adapters remain responsible for planning, scheduling, execution, runtime observations, and capability diagnostics. DataFusion remains the default local backend; a DataFusion-compatible cluster backend such as Ballista is the first concrete proof target because it can accept Substrait logical plans while adding scheduler, worker, shuffle, and distributed-observability concerns. Streaming uses the same backend-mode framing, but adds long-running lifecycle, checkpoint, watermark, offset, and sink-commit requirements for `DataStream[T]`.

## Motivation

IncQL started with a local DataFusion reference backend. That is enough for v0.1 read, transform, collect, and write workflows, but it is not enough for larger analytical work where data lives in object stores, catalogs, warehouses, or lakehouse tables and execution must happen near the data. Cluster execution is therefore not optional product polish; it is part of the credible execution story.

The risk is allowing cluster concerns to leak into IncQL's semantic layer. Distributed schedulers need job identifiers, worker registration, shuffle behavior, retry policy, adaptive execution, remote source access, and large-result handling. Those facts matter, but they are not query semantics. IncQL needs an explicit cluster lane so the implementation can support distributed execution without making physical partitioning, scheduler behavior, or backend-specific knobs part of the portable author contract.

The Apache DataFusion / Ballista 53.0.0 release is relevant because Ballista adds a Substrait scheduler client and presents a concrete DataFusion-family cluster proof target ([release notes](https://datafusion.apache.org/blog/output/2026/05/24/datafusion-ballista-53.0.0/)). IncQL should use that as implementation evidence, not as the normative definition of cluster mode.

## Goals

- Define cluster execution as a `Session` backend mode.
- Preserve one IncQL semantic model across local and cluster execution.
- Require explicit backend capability checks for cluster execution.
- Define the minimum source, sink, credential, UDF, result, error, and observation boundaries cluster mode must respect.
- Distinguish bounded cluster jobs from streaming cluster jobs without splitting the IncQL semantic model.
- Treat Ballista or another DataFusion-compatible cluster runner as a proof target behind the backend abstraction.
- Keep cluster scheduler behavior visible through execution observations rather than hidden in adapter internals.

## Non-Goals

- Defining a cluster scheduler implementation.
- Standardizing Ballista as the only cluster backend.
- Defining every DataFusion, Ballista, Spark, or warehouse configuration knob.
- Introducing cluster-specific IncQL query syntax.
- Defining storage catalog APIs, credential providers, or object-store configuration in detail.
- Defining complete streaming semantics, watermark policies, trigger semantics, or state-store implementations.
- Guaranteeing that every IncQL feature can execute on every cluster backend.
- Making physical partition IDs, shuffle layout, worker placement, or retry behavior part of portable IncQL semantics.

## Guide-level explanation (how authors think about it)

Authors should think of cluster execution as changing where a plan runs, not what the plan means.

```incan
from pub::incql import Session
from pub::incql import backends

session = (
    Session.builder()
    .with_backend(
        backends.DataFusionCluster(
            scheduler_uri="http://ballista.example.internal:50050",
            storage_profile="analytics_lake",
        )
    )
    .build()
)

orders = session.table[Order]("orders")

result = query {
    FROM orders
    WHERE .status == "completed"
    GROUP BY .region
    SELECT .region, total = sum(.amount)
}

session.write_parquet(result, "s3://warehouse/reports/regional_totals/")
```

The same logical query should be valid with a local DataFusion session when the registered sources and backend capabilities are equivalent:

```incan
local = Session.default()
cluster = (
    Session.builder()
    .with_backend(
        backends.DataFusionCluster(
            scheduler_uri="http://ballista.example.internal:50050",
            storage_profile="analytics_lake",
        )
    )
    .build()
)
```

Cluster mode may reject a plan before execution when the selected backend cannot satisfy required capabilities. For example, an IncQL-owned UDF, generator relation, typed variant value, sketch value, or extension metadata shape may be unsupported by a cluster backend. That is a backend coverage result, not an invalid IncQL program.

For large outputs, authors and tools should prefer `execute(...)` and `write(...)` over `collect(...)`. `collect(...)` remains a materialization boundary, but cluster adapters may require limits, previews, or explicit approval for large result collection.

For streaming inputs, the same pattern becomes a long-running execution:

```incan
events = session.stream[Event]("events")
alerts = important_events(events)

handle = session.execute(alerts.write_to(alert_sink("ops_alerts")))
```

The important difference is lifecycle rather than semantics. A bounded `LazyFrame[T]` cluster job can finish. A `DataStream[T]` cluster job may keep running, checkpoint state, recover from worker failure, and emit output continuously. Cluster mode must surface that lifecycle through execution handles and observations instead of pretending streaming execution is a finite `collect(...)`.

## Reference-level explanation (precise rules)

### Backend mode

Cluster execution is a backend selection under the existing `Session` contract. A session owns one execution backend for a given execution boundary. The backend may be local or cluster-backed, but the author-facing session type remains `Session`.

Backend-specific configuration must live in `pub::incql.backends` or an equivalent backend namespace. IncQL must not introduce backend-named root session types as the portable API.

### Semantic equivalence

For a plan that both local and cluster backends can execute, cluster execution must preserve the same IncQL logical result as local execution:

- schema and output aliases must match the logical plan
- row values must match the IncQL semantic contract
- ordering is guaranteed only when the logical plan declares ordering
- backend runtime metrics and physical plans may differ
- adaptive execution may change physical strategy but not logical results

If a backend cannot preserve the IncQL contract, it must report uncovered, partially covered, or unknown coverage through RFC 033-style adapter coverage records or fail with an execution error. It must not silently reinterpret the plan.

### Plan transport

Cluster adapters should accept the same logical boundary as local adapters: Prism-owned logical intent lowered to Substrait plus IncQL-owned registry metadata and read-root bindings. A DataFusion-family cluster backend may use Substrait submission when available.

Substrait is not enough by itself. The adapter must also account for:

- IncQL extension metadata and registry function anchors
- logical read-root bindings
- source and sink descriptors
- backend capability coverage
- UDF and helper deployment
- semantic profile requirements
- execution-observation capture

### Source and sink binding

Cluster workers must be able to resolve every source and sink used by a plan. A path or table binding that works on the client machine is not automatically valid in cluster mode.

Cluster backend configuration must distinguish:

- logical source names used by IncQL plans
- backend-resolved table providers or catalogs
- object-store and filesystem profiles
- credential references
- sink targets and commit behavior

Credentials must not be embedded in Prism records, Substrait plans, evidence bundles, or ordinary inspection output. Plans may reference credential or storage profiles by stable opaque identity.

### UDF and helper deployment

If an IncQL helper executes through a backend UDF, callback, extension function, or adapter-provided implementation, cluster mode must ensure that the implementation is available on every worker that may execute it.

Missing UDF deployment is a backend coverage or execution error. It must not be treated as a different function result, a null result, or a fallback to untyped SQL text.

### Results and materialization

`Session.execute(...)` may return a cluster execution handle or completed execution result depending on backend policy. The handle must carry enough identity to retrieve execution observations.

`Session.collect(...)` materializes results to the caller. In cluster mode, collection may be rejected, limited, paged, or require explicit approval when the backend can determine that the result is too large for safe client materialization.

`Session.write(...)` and typed sink writes are the preferred large-output path. Cluster writes must report commit outcome and must distinguish planning failure, worker execution failure, partial write, commit failure, and post-commit observation failure.

### Streaming cluster execution

Streaming cluster execution uses the same `Session` backend boundary and the same `DataStream[T]` model defined by RFC 001. It is not a separate query language or a separate session type.

A cluster backend that accepts `DataStream[T]` work must account for streaming-specific requirements in addition to bounded plan requirements:

- source offset or cursor tracking
- watermark and late-data policy when the plan depends on event time
- bounded-state guarantees for windows, joins, aggregations, and deduplication
- checkpoint storage and recovery behavior
- trigger, micro-batch, or continuous execution policy when exposed by the backend
- output mode and sink commit guarantees
- restart, cancellation, drain, and completion lifecycle
- replay and duplicate-output behavior after failure

`collect(...)` must not materialize an unbounded `DataStream[T]` as a finite `DataFrame[T]`. A backend may expose bounded previews, sampled observations, or time/window-limited materialization through explicit APIs, but those are preview or diagnostic operations rather than the canonical stream result.

Streaming cluster execution should prefer `execute(...)`, subscriptions, or typed sink writes. Execution handles for streaming jobs must preserve job identity across status checks and should expose enough lifecycle state for tools to distinguish pending, running, checkpointed, lagging, failed, restarting, draining, cancelled, and completed states when the backend can report them.

Streaming-specific capability coverage belongs in RFC 033 adapter coverage. Initial capability names should include source_offset_tracking, watermark_support, stateful_window_support, stateful_join_support, checkpoint_recovery, sink_commit_guarantee, replay_support, late_data_policy, and streaming_lifecycle_observations where applicable.

### Errors and diagnostics

Cluster mode must distinguish at least:

- backend configuration errors
- scheduler connection or submission errors
- source or sink binding errors
- missing worker-side UDF/helper deployment
- adapter coverage failures
- backend planning failures
- worker runtime failures
- retry exhaustion
- partial write or commit failures
- result materialization failures
- streaming checkpoint, offset, watermark, or sink-commit failures

Errors should preserve backend job identity when one exists.

### Execution observations

Cluster execution should emit RFC 032-style observations that include, when available:

- backend kind and backend version
- scheduler URI or scheduler identity
- job ID and attempt ID
- submitted logical plan identity
- backend logical and physical plan summaries
- stage, partition, and worker metrics
- shuffle, spill, skew, retry, and cancellation facts
- output sink commit facts
- adapter coverage records used during planning
- streaming lifecycle, checkpoint, watermark, offset, lag, and restart facts when executing `DataStream[T]`

Observations are evidence. They must not replace the logical plan as the source of semantic meaning.

## Design details

### Syntax

This RFC introduces no query syntax. It adds backend-selection concepts under the existing `Session.builder()` model.

Illustrative names such as `DataFusionCluster` are non-normative until implemented.

### Semantics

Cluster mode changes execution placement and physical execution strategy. It does not change IncQL expression semantics, query schema rules, function registry meaning, or Substrait lowering contracts.

### Interaction with other IncQL surfaces

- RFC 001 remains the carrier and dataset boundary. Cluster mode does not introduce new carrier types.
- RFC 001 remains the source of `BoundedDataSet[T]` / `UnboundedDataSet[T]` capability gating. Streaming cluster execution must not loosen static `DataStream[T]` restrictions.
- RFC 002 remains the Substrait interchange boundary. Cluster mode may use Substrait submission but must preserve IncQL metadata and binding contracts.
- RFC 004 remains the session and backend-selection boundary. This RFC narrows how cluster mode fits under that boundary.
- RFC 008 owns optimizer and adaptive-execution boundaries. Cluster mode may expose runtime facts used by the backend, but Prism remains the semantic logical planning owner.
- RFC 032 owns execution observations. Cluster-specific runtime facts should appear there.
- RFC 033 owns adapter requirements and coverage. Cluster backend support must be reported through that model.
- RFC 041 plan ingress frontends must keep cluster execution behind the same backend adapter boundary.

### Compatibility / migration

Existing local DataFusion sessions remain valid. Cluster mode is additive.

Implementations may initially expose cluster mode as experimental or capability-gated. A cluster backend may report unknown or uncovered coverage for existing IncQL features until worker-side deployment, Substrait support, and runtime behavior are proven.

Streaming cluster execution may remain experimental after bounded cluster execution is available. A backend can support bounded `LazyFrame[T]` cluster jobs while reporting uncovered or unknown coverage for `DataStream[T]` jobs.

Docs that say distributed execution, cluster scheduling, or shuffle are fully out of scope for IncQL should be revised once this RFC is accepted. The better boundary is: cluster scheduling mechanics are out of IncQL semantics, but cluster execution backend mode is part of the `Session` execution architecture.

## Alternatives considered

- **Leave cluster execution entirely to operational layers.** Rejected because IncQL's `Session` already owns backend selection, execution, collection, and writes. Operational layers may scope and inject sessions, but the cluster backend boundary belongs under `Session`.
- **Create a separate `ClusterSession` type.** Rejected because it splits the author-facing execution model and makes local versus cluster execution look semantically different.
- **Make Ballista the normative backend.** Rejected because Ballista is a strong proof target, not the portable contract. IncQL should support other cluster-capable backends when they can satisfy the same boundary.
- **Use raw SQL submission for cluster execution.** Rejected because raw SQL is not an IncQL `Session` escape hatch and would bypass typed logical intent, registry metadata, and Substrait contracts.
- **Expose every scheduler knob as portable IncQL API.** Rejected because backend-specific tuning belongs in backend options and evidence, not in the portable query surface.
- **Treat streams as just long bounded jobs.** Rejected because unbounded inputs need lifecycle, checkpoint, watermark, offset, and sink semantics that finite jobs do not.

## Drawbacks

- Cluster mode adds configuration, deployment, and diagnostics complexity.
- Backend coverage becomes more important and harder to prove.
- UDF/helper deployment across workers can fail in ways local execution cannot.
- Large-result collection needs guardrails that local examples often ignore.
- Streaming cluster execution adds long-running lifecycle and state recovery concerns.
- Ballista and other cluster backends may lag local DataFusion feature coverage.

## Layers affected

- **IncQL specification** — must define cluster execution as a backend mode without changing query semantics.
- **IncQL library package** — should expose cluster backend selection and typed configuration once implementation begins.
- **Execution / interchange** — adapters must preserve Substrait, registry metadata, read-root binding, coverage, and observation contracts across cluster submission. Streaming adapters must additionally report lifecycle, checkpoint, offset, watermark, and sink-commit behavior where applicable.
- **Documentation** — RFC 004 and execution-context docs should distinguish "cluster scheduling mechanics are not IncQL semantics" from "cluster backend mode is supported by the session architecture."

## Unresolved questions

- What public backend type name should the first cluster proof target use: `DataFusionCluster`, `Ballista`, or a more general scheduler-backed DataFusion selection?
- Which cluster backend options are portable enough for `backends` and which must remain opaque encoded backend options?
- What default guardrail should `collect(...)` use in cluster mode for large results?
- How should worker-side deployment of IncQL-owned UDFs and adapter callbacks be represented in coverage records?
- Which execution observations are required before cluster mode can move from experimental to planned?
- Should cluster execution require a stable storage profile abstraction before implementation, or can the first proof target use backend-specific storage options?
- Which streaming lifecycle states and capability names are required before `DataStream[T]` cluster execution can move beyond experimental?
- Should bounded cluster execution and streaming cluster execution ship under separate backend capability gates?
