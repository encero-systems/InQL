# InQL RFC 034: Quality assertions and observations

- **Status:** Implemented
- **Created:** 2026-05-29
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 004 (execution context)
  - InQL RFC 012 (unified scalar expression surface)
  - InQL RFC 016 (core aggregate functions)
  - InQL RFC 017 (aggregate modifiers)
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 032 (execution observations)
  - InQL RFC 033 (adapter requirements and coverage)
  - InQL RFC 042 (async verification evidence)
- **Issue:** [InQL #68](https://github.com/encero-systems/InQL/issues/68)
- **RFC PR:** [InQL #60](https://github.com/encero-systems/InQL/pull/60); [InQL #83](https://github.com/encero-systems/InQL/pull/83); [InQL #88](https://github.com/encero-systems/InQL/pull/88)
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** v0.1

## Summary

This RFC defines InQL quality assertions, quality assertion syntax, and quality observations. Quality assertions are typed relational checks over datasets, fields, groups, or explicit multi-relation inputs. Quality observations are runtime results produced by executing those assertions. A quality assertion is not an ordinary filter unless the author explicitly asks to filter rows.

## Motivation

Data quality needs to participate in typed relational planning without collapsing into ad hoc post-run tests or silent filters. InQL can express many quality checks as relational work: row counts, null rates, accepted values, uniqueness, ranges, group thresholds, and aggregate conditions. Those checks should produce observations that sessions, CI, and pipeline layers can consume.

## Goals

- Define quality assertions as semantic targets.
- Define quality observations as execution evidence.
- Distinguish assertion declaration from runtime result.
- Support relation, field, group, and explicit cross-relation scopes.
- Preserve the rule that quality does not silently change relation cardinality.
- Provide `quality { ... }` and expression-position `quality:` syntax for declaring assertion lists without creating a second semantic model.

## Non-Goals

- Defining pipeline orchestration, quarantine storage, retry behavior, or promotion gates.
- Defining a full Great Expectations-compatible suite model.
- Defining row-level model validation owned by the base language.
- Treating quality checks as filters by default.

## Guide-level explanation (how authors think about it)

Authors can declare checks and execute them through a session:

```incan
checks = [
    row_count(min_count=Some(1)),
    null_rate(col("customer_id"), max_rate=0.0),
    unique(col("order_id")),
]

observations = session.observe_quality(orders, checks)
```

Authors can also use the `quality` vocab surface when they want assertion declarations to read as a compact block. A `quality` block produces a `list[QualityAssertion]`; it does not execute the assertions by itself:

```incan
checks = quality {
    row_count(Some(1)).require()
    unique(.order_id)
    group_row_count([.region], 1, Some(10000)).quarantine()
}

observations = session.observe_quality(orders, checks)
```

The observations report pass, fail, error, or skipped status. The `orders` relation is not filtered by these checks unless the author separately applies a filter.

## Reference-level explanation (precise rules)

A quality assertion must include assertion identity, target, predicate or metric expression, severity, mode, scope, and evidence references.

Assertion scope must distinguish relation, field, group, and explicit cross_relation scopes. Cross-relation assertions are valid only when every relation is an explicit input to the assertion plan.

Assertion mode must distinguish observe, require, and quarantine or equivalent policy-neutral states. The mode describes intended handling, but pipeline behavior belongs outside this RFC.

A quality observation must include observation identity, assertion identity, execution attempt identity when applicable, status, metrics, diagnostics, and optional redacted sample references.

Observation status must distinguish passed, failed, errored, skipped, and unsupported.

Quality observation status describes the predicate outcome. When a quality observation is used as verification evidence, the verification observation defined by InQL RFC 042 carries the separate assurance label describing whether the predicate result was proven, verified, attested, sampled, waived, or unknown.

Quality assertions may be planned as relational work. They must not change the cardinality or contents of the checked relation unless represented as an explicit transformation requested by the author.

Quality expressions must use ordinary InQL scalar, aggregate, and grouping semantics. Invalid expression context must be diagnosed before execution where possible.

## Design details

### Syntax

This RFC introduces `quality { ... }` and expression-position `quality:` syntax for declaring a `list[QualityAssertion]`. The syntax is activated by importing `pub::inql`, like `query { ... }`.

```incan
checks = quality:
    row_count(Some(1))
    unique(.order_id).require()
    group_row_count([.region], 1, Some(10000))
```

Each body item must be an assertion expression. Brace syntax uses newline-separated assertion expressions; it is not a comma-separated list literal. Leading-dot field references are valid inside quality assertion expressions and lower to ordinary `col("field")` expressions. `quality` syntax must lower to the same `QualityAssertion` helper values as ordinary Incan code. It must not observe, enforce, filter, quarantine, or mutate a relation by itself.

### Semantics

Quality assertions produce observations. They may inform session failure, warnings, CI status, or pipeline gates, but those policies are outside the assertion semantics.

### Interaction with other InQL surfaces

`quality` syntax lowers to the same assertion model as helper calls. It may be used next to `query {}` blocks by shaping a relation with `query {}` and declaring checks with `quality {}` before passing both to a `Session` observation API. Future pipeline syntax may lower to the same assertion model, but the assertion model must not become method-chain, query-block, or quality-block specific.

### Compatibility / migration

Existing filters and projections are unaffected. Users must opt into quality assertions separately.

The first implementation adds relation, field, group, and explicit cross-relation assertion declarations plus session observation APIs. It includes `row_count(...)`, `null_rate(...)`, `unique(...)`, `group_row_count(...)`, and `cross_relation_row_count_equal()` helpers, plus `quality { ... }` and `quality:` syntax that lower to assertion lists. `Session.observe_quality(...)` evaluates relation, field, and group assertions against one lazy relation; `Session.observe_quality_pair(...)` evaluates explicit cross-relation assertions against two lazy relations. Observations reference the execution observation IDs used to compute them. Failed quality checks report `QualityObservationStatus.Failed`; they do not throw, filter rows, quarantine records, or change relation cardinality.

## Implementation plan

The implemented scope adds typed `QualityAssertion`, `QualityObservation`, `QualityMetric`, and quality enum records; helper APIs for the first assertion families; `quality` vocab syntax for assertion-list declarations; policy-neutral assertion mode/severity metadata; session evaluation APIs; concrete DataFusion-backed execution tests; reference documentation; and a task-oriented how-to guide. The evaluator uses ordinary InQL relation plans and structured materialization row counts, including aggregate/filter plans for field and group checks. It does not scrape preview text and does not push enforcement behavior into `Session`.

## Progress checklist

- [x] Define quality assertion identity, scope, mode, severity, predicate/metric, and evidence fields.
- [x] Define quality observation identity, status, metrics, diagnostics, redacted sample references, execution references, and evidence references.
- [x] Support relation, field, group, and explicit cross-relation scopes.
- [x] Add helper declarations for row-count thresholds, null-rate thresholds, uniqueness, group row-count thresholds, and cross-relation row-count equality.
- [x] Add `quality { ... }` and `quality:` syntax that lowers to assertion lists.
- [x] Add `Session.observe_quality(...)` and `Session.observe_quality_pair(...)`.
- [x] Preserve the rule that quality checks do not silently filter or mutate the checked relation.
- [x] Return unsupported observations for API/scope mismatches instead of treating them as passed.
- [x] Add DataFusion-backed tests that assert concrete pass/fail/unsupported observations and emitted metrics.
- [x] Update release notes, reference docs, and how-to docs.

## Alternatives considered

- **Treat every quality check as a filter.** Rejected because observations and transformations are different semantics.
- **Leave quality entirely to external tools.** Rejected because typed relational checks need InQL schema and expression semantics.
- **Make `quality` syntax execute checks directly.** Rejected because declaration and observation are separate semantics. The syntax produces assertion values; session APIs produce runtime observations.

## Drawbacks

- Quality APIs add another author-facing surface.
- Some checks may require backend support or additional execution cost.
- Separating observe/require/quarantine from pipeline behavior requires clear docs.

## Layers affected

- **InQL specification** — quality assertion and observation semantics become normative.
- **InQL library package** — public helper APIs, quality vocab syntax, and session observation APIs are affected.
- **Execution / interchange** — quality plans may lower to backend-executable relational work.
- **Documentation** — docs must distinguish checks, filters, and pipeline gates.

## Design decisions

### Resolved

The first release helper set is `row_count(...)`, `null_rate(...)`, `unique(...)`, `group_row_count(...)`, and `cross_relation_row_count_equal()`. This set is intentionally small but covers the RFC's required scopes: relation, field, group, and explicit cross-relation inputs. Broader expectation-suite compatibility, row-level validation, accepted-value catalogs, distribution checks, and external sampling policies remain future surfaces rather than hidden behavior in the first implementation.

Quality observations require a `Session` in the first implementation because the supported checks are relational execution evidence. Even when a check can be reduced to a row count, the observation should reference the execution attempts used to compute it. Direct in-memory carrier evaluation can be added later if `DataFrame` exposes structured row values as evidence rather than rendered preview text.

Redacted sample references are represented as `list[str]` on `QualityObservation`. The first implementation leaves the list empty. If a later sampling or quarantine surface stores samples, observations can reference those artifacts without embedding row payloads, credentials, or sensitive values in the observation record.

`quality` syntax is declaration syntax, not execution syntax. It exists to make assertion lists readable while preserving one semantic model: helper calls create `QualityAssertion` values, `quality` blocks create lists of those values, and `Session` methods create `QualityObservation` evidence.
