# Quality assertions and observations (Reference)

This page documents the public quality assertion and observation surface in the InQL package. Normative design intent lives in [RFC 034][rfc-034].

Quality assertions are declarations. They do not filter, quarantine, or mutate the checked relation by themselves. Quality observations are runtime evidence produced when a `Session` evaluates assertions against explicit relation inputs.

## Assertion helpers

| API | Scope | Purpose |
| --- | --- | --- |
| `row_count(min_count=None, max_count=None)` | relation | Assert that a relation row count is within optional inclusive thresholds |
| `null_rate(field, max_rate)` | field | Assert that the null rate for a field expression is at most `max_rate` |
| `unique(field)` | field | Assert that a field expression has no duplicate groups |
| `group_row_count(group_by, min_count=1, max_count=None)` | group | Assert that every group has a row count within inclusive thresholds |
| `cross_relation_row_count_equal()` | cross relation | Assert that two explicit relation inputs have the same row count |

The first implementation evaluates these helpers through ordinary InQL plans and `Session.collect_observed(...)`. Row-count checks use structured materialization row counts. Field and group checks build filter and aggregate plans and evaluate the resulting row counts. They do not scrape rendered preview text.

## Policy intent

`QualityAssertion.mode` records handling intent for callers that choose to enforce checks outside the assertion semantics. The first implementation keeps session evaluation policy-neutral: `observe_quality(...)` reports `Passed`, `Failed`, `Errored`, `Skipped`, or `Unsupported`; it does not throw on failed required checks.

| API | Result |
| --- | --- |
| `assertion.with_mode(mode)` | Return the same assertion with a different `QualityAssertionMode` |
| `assertion.with_severity(severity)` | Return the same assertion with a different `QualityAssertionSeverity` |
| `assertion.require()` | Return the assertion with `QualityAssertionMode.Require` |
| `assertion.quarantine()` | Return the assertion with `QualityAssertionMode.Quarantine` |

## Session APIs

| API | Input | Returns |
| --- | --- | --- |
| `session.observe_quality(data, assertions)` | `LazyFrame[T]`, `list[QualityAssertion]` | `list[QualityObservation]` |
| `session.observe_quality_pair(left, right, assertions)` | `LazyFrame[T]`, `LazyFrame[U]`, `list[QualityAssertion]` | `list[QualityObservation]` |

Use `observe_quality(...)` for relation, field, and group assertions. Use `observe_quality_pair(...)` for explicit cross-relation assertions. Passing a cross-relation assertion to the single-relation API, or a single-relation assertion to the pair API, returns an `Unsupported` quality observation with a diagnostic; it is not silently accepted.

## Core records

### `QualityAssertion`

| Field | Type | Meaning |
| --- | --- | --- |
| `assertion_id` | `str` | Stable local assertion identity |
| `name` | `str` | Human-readable assertion name |
| `kind` | `QualityAssertionKind` | Assertion family |
| `target` | `SemanticTarget` | Assertion semantic target |
| `expression` | `ColumnExpr` | Field or predicate expression used by field-scoped checks |
| `group_by` | `list[ColumnExpr]` | Grouping expressions for group-scoped checks |
| `min_count` | `Option[int]` | Inclusive minimum threshold for count checks |
| `max_count` | `Option[int]` | Inclusive maximum threshold for count checks |
| `max_rate` | `Option[float]` | Maximum rate threshold for rate checks |
| `severity` | `QualityAssertionSeverity` | Diagnostic severity intent |
| `mode` | `QualityAssertionMode` | Policy-neutral handling intent |
| `scope` | `QualityAssertionScope` | Relation, field, group, or cross-relation scope |
| `evidence_refs` | `list[str]` | Additional evidence references attached to the assertion |

### `QualityObservation`

| Field | Type | Meaning |
| --- | --- | --- |
| `observation_id` | `str` | Stable local quality observation identity |
| `target` | `SemanticTarget` | Observation semantic target |
| `assertion` | `QualityAssertion` | Assertion that was evaluated |
| `execution_observation_ids` | `list[str]` | Execution attempts used to produce the observation |
| `status` | `QualityObservationStatus` | Predicate outcome or execution support state |
| `metrics` | `list[QualityMetric]` | Compact metrics emitted by the check |
| `diagnostics` | `list[ExecutionDiagnostic]` | Structured diagnostics for errored or unsupported observations |
| `redacted_sample_refs` | `list[str]` | Optional references to separately managed samples |
| `evidence_refs` | `list[str]` | Assertion and execution evidence references |

### `QualityMetric`

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | `str` | Metric name, such as `row_count`, `null_count`, `null_rate`, or `duplicate_group_count` |
| `value` | `str` | Compact value representation |
| `unit` | `str` | Metric unit, such as `count` or `ratio` |

## Enums

| Enum | Values |
| --- | --- |
| `QualityAssertionKind` | `RowCount`, `NullRate`, `Unique`, `GroupRowCount`, `CrossRelationRowCountEqual` |
| `QualityAssertionScope` | `Relation`, `Field`, `Group`, `CrossRelation` |
| `QualityAssertionMode` | `Observe`, `Require`, `Quarantine` |
| `QualityAssertionSeverity` | `Info`, `Warning`, `Error` |
| `QualityObservationStatus` | `Passed`, `Failed`, `Errored`, `Skipped`, `Unsupported` |

## Boundaries

Quality status is predicate outcome evidence. It does not claim verification assurance; RFC 042 owns verification observations. Quality assertions may be used by policy, CI, or orchestration layers, but those layers own enforcement behavior. Session quality observation evaluates checks and reports evidence.

<!-- References -->

[rfc-034]: ../../rfcs/034_quality_assertions_observations.md
