# InQL RFC 045: Constraint evidence and verification-aware planning

- **Status:** Draft
- **Created:** 2026-06-20
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 008 (optimizer boundary, statistics, cost-based optimization, and adaptive execution)
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 030 (Prism lineage graph)
  - InQL RFC 033 (adapter requirements and coverage)
  - InQL RFC 034 (quality assertions and observations)
  - InQL RFC 040 (interoperability semantic profiles)
  - InQL RFC 042 (async verification evidence)
  - InQL RFC 043 (canonical equality and digest profiles)
  - InQL RFC 044 (verifier statements and proof artifacts)
- **Issue:** [InQL #80](https://github.com/encero-systems/InQL/issues/80)
- **RFC PR:** —
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** —

## Summary

This RFC defines constraint evidence and verification-aware planning for InQL. Constraints such as uniqueness, primary-key shape, foreign-key relationships, non-nullness, sortedness, partition coverage, and row-count bounds must be represented as evidence with assurance, and verification planners may use those constraints only when their preconditions are recorded and strong enough for the requested assurance.

## Core model

1. Constraints are evidence, not assumptions.
2. Constraint evidence has scope, source, lifecycle, outcome, assurance, profile context, and diagnostics.
3. Verification planners may choose cheaper checks when constraint evidence supports the rewrite.
4. Data-dependent verification rewrites must preserve their preconditions as evidence.
5. Planning for verification optimizes for requested assurance, cost, latency, coverage, and available adapters; it does not change authored query semantics.

## Motivation

Real verification work often depends on facts such as "this key is unique," "this table covers every partition in this range," "this relation is sorted by this field," or "this join key is referentially complete." Those facts may come from model declarations, catalogs, source metadata, target metadata, connector attestations, prior checks, or deterministic verification runs. Treating them as ordinary assumptions would make verification overconfident. Ignoring them entirely would make verification too expensive or too weak.

Query-proof systems demonstrate the value of planning with proof cost in mind. InQL should generalize that idea for operational verification: choose a digest strategy, sample strategy, join check, aggregate check, or proof backend based on available evidence and requested assurance, while keeping every required precondition visible.

## Goals

- Define constraint evidence records for verification.
- Attach assurance labels to constraints using the RFC 042 assurance model.
- Allow verification plans to consume constraint evidence when selecting checks and rewrites.
- Require data-dependent verification rewrites to record their preconditions.
- Distinguish verification planning from query optimization and from backend execution planning.
- Support cost, latency, coverage, and assurance tradeoffs without hiding uncertainty.

## Non-Goals

- Defining a complete cost model for every verification strategy.
- Replacing ordinary query optimization or execution planning.
- Treating catalog constraints as automatically true.
- Defining organization-wide approval policy for using weak constraint evidence.
- Requiring a cryptographic proof backend.

## Guide-level explanation (how authors think about it)

A verification tool may first inspect available constraints:

```incan
constraints = inspect_constraints(operational_orders, analytics_orders)

plan = plan_verification(
    relation=orders_comparison,
    requested_assurance="verified",
    constraints=constraints,
)
```

If uniqueness of `order_id` is only declared by a catalog, a planner can use it for diagnostics or suggestions but cannot silently treat it as verified:

```text
constraint=unique(order_id)
scope=operational_orders
outcome=passed
assurance=attested
source=catalog
```

A planner that needs deterministic uniqueness can schedule a uniqueness check before using keyed digest comparison:

```text
planned_step=verify_unique(order_id)
required_for=keyed_digest(order_id)
required_assurance=verified
```

The result is a verification plan that explains both the selected checks and the assumptions they depend on.

## Reference-level explanation (precise rules)

A constraint evidence record must include constraint identity, target semantic scope, constraint kind, constraint expression or field set, lifecycle state, outcome state, assurance label, source, semantic profile context, evidence references, and diagnostics.

Constraint kind should include at least:

- unique_key
- primary_key_shape
- foreign_key_relationship
- non_null
- accepted_values
- range_bound
- row_count_bound
- partition_coverage
- sorted_by
- monotonic_by
- one_to_one_mapping
- one_to_many_mapping
- referential_completeness

Constraint evidence may be declared, inferred, imported, attested, sampled, verified, waived, or unknown according to the RFC 042 assurance model. A declared or imported constraint must not be treated as verified unless a verification observation supports that assurance.

A verification plan must include plan identity, requested assurance, target assertions, selected strategy, required constraint evidence, available constraint evidence, rejected strategies when useful, expected coverage, cost or latency estimates when available, adapter requirements, semantic profile context, and diagnostics.

A verification planner may select strategies such as row count comparison, aggregate comparison, keyed row digest comparison, partition digest comparison, sample comparison, full relation materialization, proof verification, or staged combinations of those strategies.

A verification planner must not use a constraint as a correctness precondition unless the constraint's assurance satisfies the requested strategy's required assurance. If the constraint is weaker than required, the planner must schedule a constraint verification step, select a weaker strategy, require approval according to higher-level policy, or report that the requested assurance is unavailable.

Data-dependent verification rewrites must record preconditions. If a planner removes a check, switches from full row comparison to keyed digest comparison, changes join verification strategy, compacts a verification scope, or uses partition-level rollups, the plan must identify the constraint evidence that makes the rewrite sound.

Verification-aware planning must preserve unsupported coverage. If a selected strategy omits columns, operators, partitions, predicates, semantic profile dimensions, or value kinds, the plan and resulting observations must report those omissions.

Constraint evidence must carry profile context when the constraint depends on source or target semantics. A uniqueness constraint under one collation, normalization, or null-handling profile must not be reused under another profile unless equivalence evidence exists.

Constraint evidence may reference quality observations. For example, a uniqueness quality observation may support a unique_key constraint, but the constraint record must still carry its own scope, assurance, and profile context.

Constraint evidence may be included in verifier statements when the statement or proof backend depends on the constraint. A proof or deterministic verification observation must not silently rely on a constraint that is absent from the statement or linked evidence.

## Design details

### Syntax

This RFC introduces no authoring syntax. Constraint evidence and verification plans are inspection and artifact records. Future syntax may allow authors to request assurance targets or declare constraints, but the evidence records remain the normative contract.

### Semantics

Verification-aware planning chooses how to verify; it does not alter the authored relational meaning. It may generate additional verification assertions or choose an execution strategy for checks, but it must keep those choices separate from the source query plan.

Constraint evidence describes facts about data, schemas, or relationships. It is only as strong as its evidence source and assurance label.

### Interaction with other InQL surfaces

RFC 008 defines optimizer boundaries for execution planning. Verification-aware planning is separate: it plans evidence work and may use cost information, but it must not become ordinary query optimization.

RFC 034 quality observations may support constraint evidence.

RFC 042 verification observations provide lifecycle, outcome, and assurance labels for constraints and verification plan steps.

RFC 043 canonical equality profiles affect uniqueness, keyed digest, collation, and null-handling constraints.

RFC 044 verifier statements may include constraints as public evidence or preconditions when a verifier requires them.

### Standards alignment

Constraint evidence and verification plans should be projectable to public provenance, quality, lineage, and telemetry standards where useful. W3C PROV can represent constraint declarations, checks, imports, and verification planning steps as provenance activities and entities. W3C Data Quality Vocabulary can represent constraint checks as quality measurements or metrics. OpenLineage can expose verification-plan and constraint-evidence summaries as run, job, dataset, or custom facets. OpenTelemetry can expose planning and verification work as traces, spans, events, and metrics.

External catalog, lineage, and quality standards may provide constraint inputs, but imported constraints remain evidence with explicit assurance. A bridge must not upgrade catalog-declared or externally attested constraints to verified constraint evidence unless InQL can represent and validate the underlying check.

### Compatibility / migration

This RFC is additive. Existing plans without constraint evidence remain valid, but verification planners must treat missing constraint evidence as unknown rather than verified.

## Alternatives considered

- **Trust catalog constraints by default.** Rejected because catalogs and source metadata can be stale, incomplete, or semantically different from the verification profile.
- **Ignore constraints during verification planning.** Rejected because it would make many useful checks unnecessarily expensive and would fail to explain why a cheaper strategy is sound.
- **Fold verification-aware planning into ordinary query optimization.** Rejected because evidence strategy and query execution strategy have different goals and different correctness boundaries.
- **Allow data-dependent rewrites without recorded preconditions.** Rejected because users need to audit why a verification strategy was considered sound.

## Drawbacks

- Constraint evidence adds more artifacts and more conservative diagnostics.
- Verification planning can become complex when constraints have mixed assurance across partitions or profiles.
- Weak constraint evidence may force staged verification, increasing latency before strong assurance is available.
- Users may need clear reporting to distinguish a failed constraint from an unavailable verification strategy.

## Implementation architecture

This section is non-normative. A practical implementation can plan strategies such as row counts, keyed uniqueness checks, keyed digest checks, partition digest rollups, and sampled comparisons. The planner can then emit a structured plan explaining required constraints and fallback choices before any checks run.

## Layers affected

- **InQL specification** — constraint evidence and verification plan vocabulary become part of the evidence model.
- **InQL library package** — inspection and verification APIs should be able to emit constraint evidence and verification plans.
- **Execution / interchange** — adapters may report coverage for uniqueness checks, referential checks, partition coverage, and staged verification strategies.
- **Documentation** — docs must explain that constraints are evidence with assurance, not hidden assumptions.

## Unresolved questions

- Which constraint kinds are required by this RFC?
- What minimum cost and coverage fields should a verification plan expose?
- Which assurance thresholds should built-in strategies require by default?
- How should mixed-assurance constraints roll up from partitions to relations?
- Should user-declared constraints be represented as authored metadata attachments, verification assertions, or both?

<!-- When every question is resolved, rename this section to **Design Decisions**, group answers under ### Resolved, and remove this comment. -->
