# InQL RFC 033: Adapter requirements and coverage

- **Status:** Implemented
- **Created:** 2026-05-29
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 002 (Apache Substrait integration)
  - InQL RFC 004 (execution context)
  - InQL RFC 024 (function extension policy)
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 032 (execution observations)
  - InQL RFC 040 (interoperability semantic profiles)
  - InQL RFC 041 (Prism plan ingress and external client frontends)
  - InQL RFC 042 (async verification evidence)
  - InQL RFC 043 (canonical equality and digest profiles)
  - InQL RFC 044 (verifier statements and proof artifacts)
  - InQL RFC 045 (constraint evidence and verification-aware planning)
- **Issue:** [InQL #67](https://github.com/encero-systems/InQL/issues/67)
- **RFC PR:** [InQL #60](https://github.com/encero-systems/InQL/pull/60); [InQL #83](https://github.com/encero-systems/InQL/pull/83); [InQL #86](https://github.com/encero-systems/InQL/pull/86); [InQL #87](https://github.com/encero-systems/InQL/pull/87)
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** v0.1

## Summary

This RFC defines adapter requirements and coverage states for InQL. Requirements describe backend capabilities needed by a plan or evidence contract, while coverage states report whether a specific adapter can satisfy those requirements under the relevant binding and semantic profile. Unknown coverage is not enforcement.

## Motivation

Backend neutrality only works when backend limits are visible. A plan may require extension functions, precise decimal behavior, variant semantics, lineage preservation, audit emission, masking, aggregation thresholding, or other capabilities. If InQL hides adapter uncertainty, downstream systems may assume a guarantee that the selected backend cannot provide.

## Goals

- Define adapter requirements as semantic evidence targets.
- Define coverage states: covered, partially_covered, uncovered, and unknown.
- Require coverage records to name the adapter, semantic profile when relevant, and evidence.
- Keep backend inability distinct from unsupported InQL semantics.
- Make capability uncertainty explicit before execution when possible.

## Non-Goals

- Defining every possible backend capability.
- Defining physical execution strategies.
- Making any one adapter the semantic owner of InQL behavior.
- Defining organization-wide enforcement policy.

## Guide-level explanation (how authors think about it)

An inspection can reveal backend requirements:

```incan
inspection = inspect_plan(summary)

for requirement in inspection.adapter_requirements:
    print(requirement.capability, requirement.guarantee)
```

A session can then report whether the selected adapter covers the inferred requirements:

```incan
coverage = session.check_inspection_coverage(inspection)
```

If coverage is unknown for a requirement whose guarantee level is required, tools should not present that as enforced behavior.

## Reference-level explanation (precise rules)

An adapter requirement must include requirement identity, target, capability, guarantee level, reason references, and optional diagnostic text.

Capability names must be stable public vocabulary when they appear in serialized artifacts. Initial capability families should include extension_function, variant_semantics, decimal_semantics, null_semantics, lineage_preservation, audit_emission, row_filter, column_mask, aggregate_threshold, region_binding, ordered_execution, snapshot_capture, canonical_digest, cross_relation_reconciliation, incremental_watermark, verification_event_stream, waiver_recording, and cryptographic_query_proof where applicable.

Guarantee level must distinguish required, preferred, and optional requirements.

A coverage record must include requirement identity, adapter identity, adapter version when available, semantic profile identity when the evaluation depends on a profile, coverage state, evidence references, and diagnostic text.

Coverage state must distinguish:

- covered: the adapter can satisfy the requirement under the current binding
- partially_covered: the adapter can satisfy part of the requirement or only under restrictions
- uncovered: the adapter cannot satisfy the requirement
- unknown: InQL cannot determine whether the adapter can satisfy the requirement

Unknown coverage must not be treated as covered. If a requirement whose guarantee level is required is unknown or uncovered, execution must reject, route, rewrite, require approval, or report non-enforcing behavior according to the higher-level policy using the coverage record.

Backend inability must be reported as adapter coverage or execution failure. It must not be encoded as a normal Substrait-level state for core InQL semantics.

Ingress coverage belongs to plan ingress frontends. It must not be reported as backend adapter coverage unless the same feature also creates an execution requirement for the selected adapter.

## Design details

### Syntax

This RFC introduces no syntax.

### Semantics

Adapter requirements are evidence about what a plan needs. Coverage records are evidence about what a selected adapter can provide.

### Interaction with other InQL surfaces

Function registry entries, semi-structured functions, extensions, quality assertions, governed attribute constraints, and semantic profile assessments may all create adapter requirements. Execution observations may reference coverage records.

### Compatibility / migration

Existing adapters may initially report unknown coverage for capabilities they do not declare. Consumers must distinguish unknown from covered.

The first implementation provides the adapter requirement and coverage record vocabulary plus `Session.check_coverage(requirements)` for caller-provided requirements. The RFC 033 completion slice adds inspection-inferred requirements for plan evidence that InQL can observe directly, including baseline null semantics, row filters, ordered execution, extension functions, variant semantics, and lineage-preservation evidence. `Session.check_inspection_coverage(inspection)` and `Session.check_plan_coverage(data)` evaluate those inferred requirements through the same adapter coverage model. Policy requirements that are not visible in plan evidence, such as masking, audit emission, region binding, waiver recording, and cryptographic proofs, still need explicit requirement records or their owning future surfaces.

## Implementation plan

The implemented scope adds the adapter requirement and coverage vocabulary, explicit caller-provided coverage checks, inspection-inferred plan requirements, and plan/inspection coverage APIs. Requirement inference is intentionally evidence-driven: it can infer requirements from Prism plan shape, scalar function registry metadata, ordering, filters, lineage, and supported variant-aware function metadata, but it does not invent policy requirements such as masking, regional binding, audit emission, waivers, or cryptographic proofs without an owning semantic surface.

## Progress checklist

- [x] Define adapter requirement identity, target, capability, guarantee, reason references, and diagnostic fields.
- [x] Define adapter coverage state, adapter identity, semantic profile, evidence references, and diagnostic fields.
- [x] Add explicit `Session.check_coverage(requirements)` evaluation for caller-provided requirements.
- [x] Infer requirements from local plan inspection evidence where InQL owns the semantics.
- [x] Add `Session.check_inspection_coverage(inspection)` and `Session.check_plan_coverage(data)`.
- [x] Keep unknown and uncovered coverage distinct from covered behavior.
- [x] Keep backend inability in coverage or execution evidence, not as a normal Substrait-level state.
- [x] Document the reference API and task-oriented coverage workflow.
- [x] Add tests for explicit coverage, inspection-inferred coverage, unknown coverage, and concrete DataFusion-backed coverage states.

## Alternatives considered

- **Fail only at backend runtime.** Rejected because users need pre-execution visibility when possible.
- **Treat unsupported backend features as unsupported InQL semantics.** Rejected because backend inability is not the same as invalid InQL.
- **Use boolean supports flags.** Rejected because partial and unknown coverage are important operational states.

## Drawbacks

- Capability vocabulary must be maintained.
- Adapters need more metadata.
- Early coverage results may be conservative.

## Layers affected

- **InQL specification** — adapter requirement and coverage vocabulary becomes normative.
- **InQL library package** — inspection and session APIs must expose requirements and coverage.
- **Execution / interchange** — adapters must report capability evidence honestly.
- **Documentation** — docs must explain that unknown coverage is not enforcement.

## Design decisions

### Resolved

The first implementation must cover the capability families that are directly visible from current InQL evidence: null semantics, row filters, ordered execution, extension functions, variant semantics, and lineage preservation. The broader public vocabulary remains available for explicit requirements and future owning surfaces, but InQL must not infer masking, audit emission, regional binding, waiver recording, cryptographic proof, or similar governance requirements until those surfaces produce evidence.

Coverage checks are available without binding physical sources when the requirement evidence is already present in a `PlanInspection` or caller-provided requirement list. Execution still validates bindings separately. This keeps pre-execution coverage useful without pretending that plan inspection can prove physical source availability.

Adapter-specific diagnostics are normalized as coverage record diagnostics plus evidence references. A backend can report adapter-specific detail in diagnostic text, but consumers must key behavior off coverage state, requirement capability, guarantee level, adapter identity, semantic profile, and evidence references rather than parsing backend log strings.
