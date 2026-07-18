# IncQL RFC 032: Execution observations

- **Status:** Implemented
- **Created:** 2026-05-29
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - IncQL RFC 004 (execution context)
  - IncQL RFC 027 (relational evidence program)
  - IncQL RFC 028 (semantic identity and target model)
  - IncQL RFC 031 (local inspection APIs and artifacts)
  - IncQL RFC 040 (interoperability semantic profiles)
- **Issue:** [IncQL #66](https://github.com/encero-systems/IncQL/issues/66)
- **RFC PR:** [IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #85](https://github.com/encero-systems/IncQL/pull/85); [IncQL #87](https://github.com/encero-systems/IncQL/pull/87)
- **Written against:** Incan v0.3-era IncQL
- **Shipped in:** v0.1

## Summary

This RFC defines execution observations for IncQL sessions. Execution observations correlate runtime attempts with semantic plan targets and record backend, adapter, semantic profile context, status, timing, diagnostics, row counts, and optional trace identifiers without making runtime logs the source of relational semantics.

## Motivation

After a plan executes, users and tools need evidence about what was attempted and what happened. A result table alone cannot explain which plan version ran, which adapter executed it, which diagnostics occurred, or how runtime observations attach to semantic targets. IncQL needs a lightweight execution observation model that is structural, redacted by default, and independent of any particular telemetry backend.

## Goals

- Define execution attempts as semantic targets.
- Correlate session execution with plan identity.
- Record backend and adapter information, semantic profile context when available, status, diagnostics, row counts, and timing.
- Allow optional trace/log/metric correlation without requiring a telemetry provider.
- Preserve redaction defaults for payload-heavy or sensitive data.

## Non-Goals

- Defining an OpenTelemetry provider, collector, exporter, or sampling policy.
- Defining pipeline orchestration or retry semantics.
- Recording row payloads, samples, or full backend logs by default.
- Letting backend execution redefine plan lineage or schema semantics.

## Guide-level explanation (how authors think about it)

An author can collect data and then inspect the observation:

```incan
observed = session.collect_observed(summary)
observation = observed.observation

assert observation.plan_target.target_id == inspect_plan(summary).plan_id
assert observation.status == ExecutionObservationStatus.Success
```

Execution evidence explains the run. It does not replace plan inspection.

## Reference-level explanation (precise rules)

An execution observation must include an execution attempt target, plan target, session or binding context reference, backend name, adapter version when available, start time, end time or duration, status, diagnostics, and optional row count, byte count, trace identifier, requested semantic profile, and observed semantic profile.

Execution status must distinguish at least success, failure, cancelled, skipped, and unsupported.

Diagnostics must be structured records. Sensitive values, row samples, query payloads, credentials, and source data must not be included by default.

An execution observation may reference local inspection artifacts or semantic targets produced before execution. It must not mutate authored Prism targets or claim lineage that was not present in the plan evidence model.

Telemetry integrations may emit equivalent spans, events, logs, or metrics, but the IncQL observation model must remain usable when no telemetry backend is configured.

## Design details

### Syntax

This RFC introduces no syntax.

### Semantics

Execution observations are runtime evidence. They describe an attempt to execute a semantic plan through a session and adapter.

### Interaction with other IncQL surfaces

Quality observations, adapter coverage records, semantic profile records, and evidence exchange bridges may refer to execution observations. Pipeline layers may consume them, but orchestration behavior remains outside this RFC.

### Compatibility / migration

Existing session execution remains valid. Implementations may initially emit partial observations, but unsupported fields must be explicit rather than silently omitted when consumers request them.

The first implementation adds observed variants for `execute`, `collect`, and `write` while preserving the ordinary `Result[...]`-returning session APIs. Observed variants return success and failure observations. Wall-clock fields are Unix nanoseconds from Incan's `std.datetime.runtime.SystemTime`, and duration uses monotonic elapsed nanoseconds from `std.datetime.runtime.Instant`. The model exposes adapter version, requested and observed semantic profile IDs, byte count, and trace IDs explicitly; the initial DataFusion path reports `None` or empty values for those fields rather than fabricating unavailable evidence.

## Implementation plan

The implemented scope adds typed execution observation records, observed `Session.execute_observed`, `Session.collect_observed`, and `Session.write_observed` APIs, observation-backed result carriers, diagnostic capture for success and failure paths, and session-level coverage integration so execution evidence can refer to adapter coverage records without making coverage checks part of the execution semantics themselves. The first implementation deliberately keeps telemetry provider export out of scope; local structured observations are the source of truth and trace identifiers remain optional correlation values.

## Progress checklist

- [x] Define execution observation status, operation, diagnostic, timing, adapter, semantic-profile, trace, and metric fields.
- [x] Add observed execution, collection, and write APIs while preserving existing session APIs.
- [x] Emit success and failure observations with structured diagnostics.
- [x] Keep row payloads, credentials, backend logs, and sensitive values out of observations by default.
- [x] Let observations reference adapter coverage records without treating coverage as execution semantics.
- [x] Document the reference API and task-oriented observation workflow.
- [x] Add tests for success observations, failure observations, write observations, diagnostics, timing, and coverage references.

## Alternatives considered

- **Use backend logs only.** Rejected because logs are not stable semantic evidence and may be sensitive.
- **Require OpenTelemetry for all observations.** Rejected because local IncQL evidence should work without provider configuration.
- **Attach execution data directly to plan nodes.** Rejected because runtime attempts are lifecycle events, not authored plan structure.

## Drawbacks

- Observation records add runtime overhead.
- Redaction can make diagnostics less convenient if users expect full backend logs.
- Correlating observations with plan snapshots requires stable semantic identity.

## Layers affected

- **IncQL specification** — execution observation fields and status values become normative.
- **IncQL library package** — Session results must expose observations.
- **Execution / interchange** — adapters must report execution facts without redefining semantics.
- **Documentation** — docs must explain observation redaction and telemetry independence.

## Design decisions

### Resolved

Every adapter-backed observation must provide the semantic attempt target, plan target, operation, status, backend name, start/end timing, duration when available, diagnostics, trace identifier list, requested and observed semantic profile IDs when available, and optional row and byte counts. Adapter version, profile IDs, row count, byte count, coverage records, and trace identifiers may be absent or empty when the adapter cannot honestly provide them, but the field shape remains present so consumers can distinguish unavailable evidence from missing implementation.

Failed planning, binding, and lowering attempts use the same execution observation model when they occur through a session operation and can be attached to a plan target or the explicit unavailable-plan target. Their diagnostics identify which stage failed. This keeps runtime attempt evidence uniform without claiming that an authored Prism plan exists when planning did not complete.

Trace identifiers are represented as `list[str]`. IncQL does not interpret the values or require a telemetry provider. Multiple telemetry systems can add multiple opaque identifiers, and local execution remains valid when the list is empty.
