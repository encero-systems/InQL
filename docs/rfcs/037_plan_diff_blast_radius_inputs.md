# IncQL RFC 037: Plan diff and blast-radius inputs

- **Status:** Implemented
- **Created:** 2026-05-29
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - IncQL RFC 007 (Prism logical planning and optimization engine)
  - IncQL RFC 027 (relational evidence program)
  - IncQL RFC 028 (semantic identity and target model)
  - IncQL RFC 030 (Prism lineage graph)
  - IncQL RFC 031 (local inspection APIs and artifacts)
  - IncQL RFC 036 (governed plan bundle)
  - IncQL RFC 040 (interoperability semantic profiles)
- **Issue:** [IncQL #71](https://github.com/encero-systems/IncQL/issues/71)
- **RFC PR:** [IncQL #60](https://github.com/encero-systems/IncQL/pull/60); [IncQL #95](https://github.com/encero-systems/IncQL/pull/95)
- **Written against:** Incan v0.4-era IncQL
- **Shipped in:** IncQL v0.1

## Summary

This RFC defines local IncQL plan diffs and blast-radius input artifacts. A plan diff compares two IncQL evidence artifacts and classifies changes in output schema, field identity, lineage, joins, filters, aggregates, windows, generators, quality assertions, semantic profiles, adapter requirements, and coverage. The result is a local input to downstream impact analysis, not an organization-wide blast-radius service.

## Motivation

Typed relational evidence should help users understand change before it reaches production. If a query changes, tools should know whether output fields changed, dependencies changed, adapter requirements changed, or quality checks changed. IncQL can produce accurate local diff evidence because it owns the plan and lineage, but it should not claim to know every downstream consumer in every organization.

## Goals

- Define local plan diff inputs and outputs.
- Classify structural, schema, lineage, quality, semantic profile, and adapter-requirement changes.
- Treat unknown impact as an explicit result.
- Provide downstream systems with blast-radius inputs without defining a global blast-radius engine.

## Non-Goals

- Defining cross-repository dependency indexing.
- Defining organization-wide consumer discovery.
- Defining approvals, promotions, or change-management workflows.
- Deciding whether a change is acceptable for every downstream system.

## Guide-level explanation (how authors think about it)

A CI job can compare two plan artifacts:

```incan
before = read_plan_artifact("main/summary.plan.json")
after = inspect_plan(summary)

diff = diff_plans(before, after)
diff.changed_output_fields()
diff.changed_adapter_requirements()
```

The diff tells IncQL-local facts. A higher-level system may combine those facts with dependency indexes and approvals.

## Reference-level explanation (precise rules)

A plan diff must compare two compatible IncQL evidence artifacts or bundles. If artifacts are incompatible, stale, or missing required identity information, the diff must report unsupported or unknown impact.

The diff must classify at least:

- output field added
- output field removed
- output field renamed
- field type changed
- field nullability changed
- field lineage changed
- relation input changed
- filter predicate changed
- join structure changed
- aggregate measure changed
- window specification changed
- generator output changed
- semi-structured or format access confidence changed
- quality assertion changed
- semantic profile changed
- profile assessment changed
- adapter requirement changed
- coverage state changed

Diff records must include affected semantic targets when available, change kind, severity or compatibility classification when known, evidence references, and confidence.

Unknown impact must be explicit. If IncQL cannot determine whether a change affects a target, it must not omit the target silently.

Plan diffs may produce blast-radius input artifacts. Those artifacts describe local affected targets and requirement changes. They do not claim to enumerate all downstream consumers outside IncQL's local artifact set.

## Design details

### Syntax

This RFC introduces no syntax.

### Semantics

Diffs operate over evidence artifacts, not raw source text. Text diffs may be useful but are not sufficient for semantic change classification.

### Interaction with other IncQL surfaces

Plan diffs depend on stable semantic identity, lineage, inspection artifacts, semantic profiles, and governed plan bundles. They should not be implemented before those contracts exist.

### Compatibility / migration

Older artifacts may not contain enough identity or lineage for precise diffs. Diff output must make that limitation explicit.

## Alternatives considered

- **Use textual diffs only.** Rejected because text diffs cannot reliably classify relational meaning changes.
- **Make IncQL own full blast radius.** Rejected because downstream consumers, deployments, dashboards, and global dependency indexes are outside IncQL.
- **Ignore unknown impact.** Rejected because unknown impact is a real result.

## Drawbacks

- Precise diffs require stable artifacts across versions.
- Conservative diffs may produce noisy warnings.
- Compatibility classification can become complex and may need iteration.

## Layers affected

- **IncQL specification** — change kinds and local diff semantics become normative.
- **IncQL library package** — diff APIs must compare structured artifacts.
- **Execution / interchange** — adapter requirement changes must be included where execution behavior changes.
- **Documentation** — docs must distinguish local blast-radius inputs from global impact analysis.

## Design Decisions

### Resolved

- The first release classifies output-field removals, output-field renames, and output-schema changes as locally breaking; output-field additions, lineage changes, node-shape changes, and adapter requirement changes are conservative potentially-breaking records; evidence-only and compatibility records are unknown unless a future RFC defines stronger policy.
- IncQL owns conservative local compatibility classes because they are evidence facts about the compared artifacts. Organization-specific severity, approval, promotion, and consumer-impact decisions remain downstream policy.
- Generated and plan-local IDs are not treated as global identity. Diff keys use semantic facts where possible, such as target kind, display name, governed key, and scope. When IncQL cannot compare safely because schema versions or identity assumptions are incompatible, it emits explicit unknown-impact records instead of silently returning an empty diff.
