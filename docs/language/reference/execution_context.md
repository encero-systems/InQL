# Execution context (Reference)

This page documents the public execution surface in the IncQL package. Normative design intent lives in [RFC 004][rfc-004].

## Core types

- `Session` is the public execution context for registration, binding, execution, collection, and writes.
- `SessionBuilder` configures a `Session` before construction.
- `SessionError` is the typed error surface for registration, planning, execution, materialization, and sink failures.
- `BackendSelection` is the portable backend selection envelope stored by a session.
- `BackendOption` carries adapter-specific configuration without adding one field per backend to `Session`.
- `backends.DataFusion()` is the current reference backend configuration entry point.

## Construction

| API                                                                | Purpose                                                             |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `Session.default()`                                                | Create a session with the default backend and default configuration |
| `Session.builder()`                                                | Create a builder for backend selection and configuration            |
| `Session.builder().with_backend(selection).build()`                | Build a session from a portable backend-selection envelope           |
| `Session.builder().with_datafusion(backends.DataFusion()).build()` | Build an explicit DataFusion-backed session                         |

## Read and registration surface

| API                                  | Returns                              | Notes                                                    |
| ------------------------------------ | ------------------------------------ | -------------------------------------------------------- |
| `session.register(name, source)`     | `Result[None, SessionError]`         | Bind a logical relation name to a source definition      |
| `session.table(name)`             | `Result[LazyFrame[T], SessionError]` | Resolve a registered logical relation by name            |
| `session.read_csv(name, uri)`     | `Result[LazyFrame[T], SessionError]` | Register and return a deferred CSV-backed relation       |
| `session.read_parquet(name, uri)` | `Result[LazyFrame[T], SessionError]` | Register and return a deferred Parquet-backed relation   |
| `session.read_arrow(name, uri)`   | `Result[LazyFrame[T], SessionError]` | Register and return a deferred Arrow IPC-backed relation |

All read APIs return `LazyFrame[T]`. They create deferred logical work; they do not fetch rows immediately.

## Execution and materialization surface

| API                     | Returns                              | Role                                                                                       |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `session.execute(data)` | `Result[LazyFrame[T], SessionError]` | Execute the backend path as a validation/checkpoint boundary without materializing locally |
| `session.collect(data)` | `Result[DataFrame[T], SessionError]` | Execute and materialize a local `DataFrame[T]`                                             |
| `lazy.collect()`        | `Result[DataFrame[T], SessionError]` | Convenience form that resolves through the active session at call time                     |

`execute(...)` and `collect(...)` are intentionally different:

- `execute(...)` proves the plan can bind, lower, and run.
- `collect(...)` performs that same work and materializes a local `DataFrame[T]`.

## Execution observations

Observed execution methods preserve the ordinary session contracts while also returning runtime evidence. The ordinary `execute`, `collect`, and `write` methods use the same execution path internally and keep returning `Result[...]` values for compact application code.

| API                                      | Input               | Returns                | Success data                       | Failure data                      |
| ---------------------------------------- | ------------------- | ---------------------- | ---------------------------------- | --------------------------------- |
| `session.execute_observed(data)`         | `LazyFrame[T]`      | `ObservedLazyFrame[T]` | `data=Some(LazyFrame[T])`          | `data=None`, `error=Some(...)`    |
| `session.collect_observed(data)`         | `LazyFrame[T]`      | `ObservedDataFrame[T]` | `data=Some(DataFrame[T])`          | `data=None`, `error=Some(...)`    |
| `session.write_observed(data, target)`   | `BoundedDataSet[T]` | `ObservedWrite`        | `error=None`                       | `error=Some(...)`                 |

### Observed result records

| Record                 | Fields                                      |
| ---------------------- | ------------------------------------------- |
| `ObservedLazyFrame[T]` | `data: Option[LazyFrame[T]]`, `observation: ExecutionObservation`, `error: Option[SessionError]` |
| `ObservedDataFrame[T]` | `data: Option[DataFrame[T]]`, `observation: ExecutionObservation`, `error: Option[SessionError]` |
| `ObservedWrite`        | `observation: ExecutionObservation`, `error: Option[SessionError]` |

### `ExecutionObservation`

| Field                                   | Type                          | Meaning                                                        |
| --------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `observation_id`                        | `str`                         | Stable local identifier for this observation attempt           |
| `attempt_target`                        | `SemanticTarget`              | Semantic target for the concrete execution attempt             |
| `plan_target`                           | `SemanticTarget`              | Semantic target for the plan being attempted                   |
| `context_targets`                       | `list[SemanticTarget]`        | Session or binding context targets attached to the attempt     |
| `operation`                             | `ExecutionOperationKind`      | Operation family: `execute`, `collect`, or `write`             |
| `status`                                | `ExecutionObservationStatus`  | Terminal status                                                |
| `backend_name`                          | `str`                         | Selected backend name, currently `datafusion` by default       |
| `adapter_version`                       | `Option[str]`                 | Adapter version when reported by the backend                   |
| `requested_semantic_profile_id`         | `Option[str]`                 | Requested semantic profile identity when one is bound          |
| `observed_semantic_profile_id`          | `Option[str]`                 | Observed semantic profile identity when the adapter reports one |
| `started_at_unix_nanoseconds`           | `int`                         | Wall-clock start timestamp from `std.datetime.runtime.SystemTime` |
| `ended_at_unix_nanoseconds`             | `int`                         | Wall-clock end timestamp from `std.datetime.runtime.SystemTime` |
| `duration_nanoseconds`                  | `int`                         | Monotonic elapsed duration from `std.datetime.runtime.Instant` |
| `row_count`                             | `Option[int]`                 | Materialized row count when the operation supplies one         |
| `byte_count`                            | `Option[int]`                 | Byte count when the operation supplies one                     |
| `trace_ids`                             | `list[str]`                   | Optional external trace or telemetry correlation IDs           |
| `diagnostics`                           | `list[ExecutionDiagnostic]`   | Structured diagnostics attached to the attempt                 |
| `coverage_records`                      | `list[AdapterCoverageRecord]` | Adapter coverage records linked to the attempt                 |
| `evidence_refs`                         | `list[str]`                   | Additional evidence artifact references                        |

Observation records do not contain row payloads or backend logs by default. The first DataFusion-backed implementation reports unavailable adapter-version, semantic-profile, byte-count, and trace evidence as `None` or `[]` rather than fabricating values.

### Execution enums

| Enum                          | Values                                           |
| ----------------------------- | ------------------------------------------------ |
| `ExecutionOperationKind`      | `Execute`, `Collect`, `Write`                    |
| `ExecutionObservationStatus`  | `Success`, `Failure`, `Cancelled`, `Skipped`, `Unsupported` |
| `ExecutionDiagnosticSeverity` | `Info`, `Warning`, `Error`                       |

### `ExecutionDiagnostic`

| Field      | Type                          | Meaning                                      |
| ---------- | ----------------------------- | -------------------------------------------- |
| `severity` | `ExecutionDiagnosticSeverity` | Diagnostic severity                          |
| `code`     | `str`                         | Stable diagnostic code                       |
| `message`  | `str`                         | Human-readable diagnostic message            |
| `target`   | `Option[SemanticTarget]`      | Semantic target associated with the diagnostic |

## Write surface

| API                                      | Returns                      | Notes                                                |
| ---------------------------------------- | ---------------------------- | ---------------------------------------------------- |
| `csv_sink(uri)`                          | `SinkTarget`                 | Build a typed CSV sink descriptor                    |
| `parquet_sink(uri)`                      | `SinkTarget`                 | Build a typed Parquet sink descriptor                |
| `session.write(data, target)`            | `Result[None, SessionError]` | Execute deferred input if needed, then write target  |
| `session.write_csv(data, uri)`           | `Result[None, SessionError]` | Convenience form for CSV sinks                       |
| `session.write_parquet(data, uri)`       | `Result[None, SessionError]` | Convenience form for Parquet sinks                   |

These writes are Session-owned. They do not bypass the execution context even when the input is deferred.

## Adapter coverage

`session.check_coverage(requirements)` accepts explicit `AdapterRequirement` records and returns one `AdapterCoverageRecord` per requirement. `session.check_inspection_coverage(inspection)` evaluates the requirements inferred by local plan inspection, and `session.check_plan_coverage(data)` runs inspection first and then evaluates those inferred requirements.

Plan inference is evidence-backed rather than policy-complete. The current implementation infers requirements for baseline null semantics, row filters, ordered execution, extension functions, variant semantics, and lineage-preservation evidence when those facts appear in the inspected plan. Requirements such as audit emission, masking, region binding, cryptographic proof, waiver recording, and other organization policy capabilities still need explicit `AdapterRequirement` records until their owning surfaces add evidence that can be inspected.

| API                                             | Input                      | Returns                       |
| ----------------------------------------------- | -------------------------- | ----------------------------- |
| `session.check_coverage(requirements)`          | `list[AdapterRequirement]` | `list[AdapterCoverageRecord]` |
| `session.check_inspection_coverage(inspection)` | `PlanInspection`           | `list[AdapterCoverageRecord]` |
| `session.check_plan_coverage(data)`             | `LazyFrame[T]`             | `list[AdapterCoverageRecord]` |

### `AdapterRequirement`

| Field            | Type                           | Meaning                                            |
| ---------------- | ------------------------------ | -------------------------------------------------- |
| `requirement_id` | `str`                          | Stable local requirement identifier                |
| `target`         | `SemanticTarget`               | Semantic target that requires the capability       |
| `capability`     | `AdapterRequirementCapability` | Required adapter capability family                 |
| `guarantee`      | `AdapterRequirementGuarantee`  | Requirement strength: required, preferred, optional |
| `reason`         | `str`                          | Human-readable reason for the requirement          |
| `evidence_refs`  | `list[str]`                    | Evidence artifacts that justify the requirement    |

### `AdapterCoverageRecord`

| Field                 | Type                         | Meaning                                              |
| --------------------- | ---------------------------- | ---------------------------------------------------- |
| `coverage_id`         | `str`                        | Stable local coverage-record identifier              |
| `requirement`         | `AdapterRequirement`         | Requirement that was evaluated                       |
| `adapter_name`        | `str`                        | Adapter that was evaluated                           |
| `adapter_version`     | `Option[str]`                | Adapter version when reported                        |
| `semantic_profile_id` | `Option[str]`                | Semantic profile identity when relevant              |
| `state`               | `AdapterCoverageState`       | Coverage result                                      |
| `diagnostics`         | `list[ExecutionDiagnostic]`  | Diagnostics explaining partial, uncovered, or unknown coverage |
| `evidence_refs`       | `list[str]`                  | Evidence artifacts that support the coverage answer  |

### Adapter requirement enums

| Enum                          | Values |
| ----------------------------- | ------ |
| `AdapterRequirementGuarantee` | `Required`, `Preferred`, `Optional` |
| `AdapterCoverageState`        | `Covered`, `PartiallyCovered`, `Uncovered`, `Unknown` |
| `AdapterRequirementCapability` | `ExtensionFunction`, `VariantSemantics`, `DecimalSemantics`, `NullSemantics`, `LineagePreservation`, `AuditEmission`, `RowFilter`, `ColumnMask`, `AggregateThreshold`, `RegionBinding`, `OrderedExecution`, `SnapshotCapture`, `CanonicalDigest`, `CrossRelationReconciliation`, `IncrementalWatermark`, `VerificationEventStream`, `WaiverRecording`, `CryptographicQueryProof` |

Coverage states are conservative. `Covered` means the selected adapter is known to cover that requirement family. `PartiallyCovered` means support depends on the concrete function, plan shape, or restriction. `Uncovered` means the selected adapter is known not to provide that guarantee. `Unknown` means IncQL has not classified coverage; consumers must not treat it as enforced behavior.

### Current DataFusion coverage classification

| Capability                              | State              |
| --------------------------------------- | ------------------ |
| `RowFilter`                             | `Covered`          |
| `OrderedExecution`                      | `Covered`          |
| `NullSemantics`                         | `Covered`          |
| `ExtensionFunction`                     | `PartiallyCovered` |
| `LineagePreservation`                   | `Uncovered`        |
| `AuditEmission`                         | `Uncovered`        |
| Any other `AdapterRequirementCapability` | `Unknown`          |

For non-DataFusion backends, the current implementation returns `Unknown` for every capability until that adapter declares coverage metadata.

## Quality observation APIs

`Session` also evaluates quality assertions and returns structured quality observations. The quality reference owns the assertion and observation record details; this page lists the session entry points because they execute through the same session boundary as collection and adapter coverage.

| API | Input | Returns |
| --- | --- | --- |
| `session.observe_quality(data, assertions)` | `LazyFrame[T]`, `list[QualityAssertion]` | `list[QualityObservation]` |
| `session.observe_quality_pair(left, right, assertions)` | `LazyFrame[T]`, `LazyFrame[U]`, `list[QualityAssertion]` | `list[QualityObservation]` |

Use `observe_quality(...)` for relation, field, and group assertions. Use `observe_quality_pair(...)` for explicit cross-relation assertions. Failed checks return quality observations with `QualityObservationStatus.Failed`; they do not throw or filter the checked relation by default.

## Active-session convenience

| API                            | Returns                         | Purpose                                                   |
| ------------------------------ | ------------------------------- | --------------------------------------------------------- |
| `session.activate()`           | `None`                          | Make this session the active session for convenience APIs |
| `Session.get_active_session()` | `Result[Session, SessionError]` | Fetch the currently active session                        |

The active-session model exists for convenience entry points such as `lazy.collect()` and display helpers. Session-owned APIs such as `session.write_csv(...)` do not require activation because the session is already explicit at the call site.

If no active session exists when a convenience API needs one, the operation fails with a typed `SessionError`.

## Data model notes

- `LazyFrame[T]` is the deferred carrier for bounded work.
- `DataFrame[T]` is the materialized local carrier.
- `collect(...)` materialization stores structured metadata plus preview text:
  - resolved output columns
  - row count
  - preview text for display/debugging
- Preview text is for display/debugging; resolved output columns are the schema contract surfaced by collection.

## Backend note

DataFusion is the implemented execution backend. `Session` stores a backend kind plus encoded options, lowers work to Substrait, and dispatches through an internal backend adapter boundary. DataFusion is the first adapter behind that boundary; it is not the shape of the `Session` state.

## Related docs

- For the conceptual model behind this surface, see [Execution context (Explanation)](../explanation/execution_context.md)
- For task-oriented examples, see [Capture execution observations and adapter coverage](../how-to/execution_observations.md)
- For quality assertion and observation records, see [Quality assertions and observations](quality.md)
- For task-oriented quality examples, see [Observe data quality checks](../how-to/quality_observations.md)
- For carrier semantics, see [Dataset carriers (Reference)](dataset_carriers.md)
- For execution observation design, see [RFC 032][rfc-032]
- For adapter requirement and coverage design, see [RFC 033][rfc-033]
- For quality assertion and observation design, see [RFC 034][rfc-034]

[rfc-004]: ../../rfcs/004_incql_execution_context.md
[rfc-032]: ../../rfcs/closed/implemented/032_execution_observations.md
[rfc-033]: ../../rfcs/closed/implemented/033_adapter_requirements_coverage.md
[rfc-034]: ../../rfcs/closed/implemented/034_quality_assertions_observations.md
