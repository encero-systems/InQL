# Execution context (Reference)

This page documents the public execution surface in the InQL package. Normative design intent lives in [RFC 004][rfc-004].

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

Observed execution methods preserve the ordinary session contracts while also returning runtime evidence. They are the author-facing surface for RFC 032 execution observations.

| API                              | Returns                  | Role                                                                 |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| `session.execute_observed(data)` | `ObservedLazyFrame[T]`   | Execute and return `data`, `observation`, and `error` fields         |
| `session.collect_observed(data)` | `ObservedDataFrame[T]`   | Collect and return `data`, `observation`, and `error` fields         |
| `session.write_observed(data, target)` | `ObservedWrite`    | Write and return `observation` plus an optional `error`              |

The ordinary `execute`, `collect`, and `write` methods use the same execution path internally and keep returning `Result[...]` values for compact application code. Use the observed variants when an audit, governance, debugging, or verification flow needs a durable execution attempt record.

An `ExecutionObservation` records the operation, status, backend name, optional adapter version, requested and observed semantic profile IDs, plan target, execution-attempt target, client-session context target, Unix nanosecond wall-clock start/end values from `std.datetime.runtime.SystemTime`, monotonic duration nanoseconds from `std.datetime.runtime.Instant`, row count or byte count when materialization supplies them, optional trace IDs, diagnostics, and linked coverage records when present. Observation records do not contain row payloads or backend logs by default.

```incan
observed = session.collect_observed(summary)

assert observed.observation.status == ExecutionObservationStatus.Success
match observed.data:
    Some(df) => println(df.preview_text())
    None => println(observed.observation.diagnostics[0].message)
```

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

`session.check_coverage(requirements)` accepts explicit `AdapterRequirement` records and returns one `AdapterCoverageRecord` per requirement. This is the current RFC 033 coverage surface. It does not infer requirements from every plan shape yet; callers must pass the requirements they want evaluated.

Coverage states are conservative:

- `covered` means the selected adapter is known to cover that requirement family.
- `partially_covered` means support depends on the concrete function, plan shape, or restriction.
- `uncovered` means the selected adapter is known not to provide that guarantee.
- `unknown` means InQL has not classified coverage; consumers must not treat it as enforced behavior.

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
- For carrier semantics, see [Dataset carriers (Reference)](dataset_carriers.md)

[rfc-004]: ../../rfcs/004_inql_execution_context.md
