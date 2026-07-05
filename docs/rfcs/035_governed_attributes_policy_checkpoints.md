# InQL RFC 035: Governed attributes and policy checkpoints

- **Status:** Implemented
- **Created:** 2026-05-29
- **Author(s):** Danny Meijer (@dannymeijer)
- **Related:**
  - InQL RFC 004 (execution context)
  - InQL RFC 027 (relational evidence program)
  - InQL RFC 028 (semantic identity and target model)
  - InQL RFC 029 (typed metadata attachments)
  - InQL RFC 030 (Prism lineage graph)
  - InQL RFC 033 (adapter requirements and coverage)
- **Issue:** [InQL #69](https://github.com/encero-systems/InQL/issues/69)
- **RFC PR:** [InQL #60](https://github.com/encero-systems/InQL/pull/60); [InQL #89](https://github.com/encero-systems/InQL/pull/89)
- **Written against:** Incan v0.3-era InQL
- **Shipped in:** v0.1

## Summary

This RFC defines how InQL carries governed attributes and records policy checkpoints as local relational evidence. Governed attributes are typed facts attached to semantic targets with provenance, confidence, authority, and lifetime. Policy checkpoints are decision records attached at authoring, planning, binding, or execution boundaries. InQL carries and propagates evidence; it does not define an organization-wide policy engine.

## Motivation

Relational plans often need to carry facts such as classification, origin, purpose, jurisdiction, derivation, masking status, or coverage state. Those facts may be supplied by model metadata, user declarations, imported artifacts, catalogs, policy engines, or prior plans. InQL should preserve and propagate them through relational semantics without pretending that inferred attributes are automatically authoritative policy truth.

## Goals

- Define governed attributes as typed evidence attached to semantic targets.
- Preserve source, confidence, authority, status, observed time, expiration, and evidence references.
- Define policy checkpoint records at authoring, planning, binding, and execution.
- Allow InQL to explain how attributes move through relational transformations.
- Keep policy authoring, approval, and global enforcement outside InQL.

## Non-Goals

- Defining a policy language.
- Defining a global invariant registry.
- Defining approvals, stewardship, ownership, or certification workflow.
- Deciding legal or compliance obligations.
- Making inferred attributes authoritative without review or explicit status.

## Guide-level explanation (how authors think about it)

An inspection may show that an output field carries derived attributes:

```incan
lineage = inspect_lineage(report)
field = lineage.output_field("email_domain")

for attribute in field.governed_attributes():
    print(attribute.key, attribute.status, attribute.confidence)
```

If a policy engine or session binding later allows, masks, warns, or rejects part of the plan, that result appears as a policy checkpoint record attached to the relevant target.

## Reference-level explanation (precise rules)

A governed attribute must include attribute identity, target, key, typed value, scope, source, confidence, status, authority when available, observed time when available, expiration time when available, and evidence references.

Attribute scope must distinguish at least field, relation, expression, plan, output, and execution_path scopes.

Attribute source must distinguish at least model, user, lineage, catalog, policy, adapter, imported artifact, and inferred.

Confidence must distinguish exact, high, medium, low, and unknown or equivalent ordered states.

Status must distinguish asserted, inferred, accepted, rejected, overridden, stale, and pending_review or equivalent review states.

InQL may propagate attributes through relational transformations when transformation semantics are known. It must preserve provenance and confidence. It must report conservative or unknown propagation when exact propagation is not available.

A policy checkpoint record must include decision identity, target, checkpoint, action, policy reference, reason code, evidence references, visibility, and optional diagnostics.

Checkpoint must distinguish authoring, planning, binding, and execution. Action must distinguish at least allow, deny, redact, mask, row_filter, warn, require_quality_check, require_approval, and observe.

Policy checkpoint records are evidence of a decision or external result. They must not by themselves define the policy language that produced the decision.

## Design details

### Syntax

This RFC introduces no policy syntax.

### Semantics

InQL owns attribute carriage, propagation evidence, and checkpoint records. It does not own organizational policy meaning.

### Interaction with other InQL surfaces

Lineage edges explain how attributes may propagate. Adapter requirements may be created when a policy checkpoint requires backend capabilities such as masking or row filtering.

### Compatibility / migration

Existing plans without governed attributes remain valid. Consumers must treat absent attributes, unknown attributes, and rejected attributes as distinct states when those distinctions are available.

## Alternatives considered

- **Make InQL a policy engine.** Rejected because policy authoring and approval are outside typed relational semantics.
- **Use plain metadata tags only.** Rejected because provenance, confidence, authority, and status are required for trustworthy evidence.
- **Drop uncertain attributes.** Rejected because uncertainty is meaningful evidence.

## Drawbacks

- Attribute propagation can be complex and conservative.
- Policy checkpoint records can be mistaken for policy semantics unless docs are clear.
- More lifecycle states increase author and tool complexity.

## Layers affected

- **InQL specification** — governed attribute and checkpoint record semantics become normative.
- **InQL library package** — inspection APIs must expose attributes and decisions as typed records.
- **Execution / interchange** — Session and adapters may attach binding and execution checkpoint records.
- **Documentation** — docs must distinguish attribute evidence from policy authority.

## Design Decisions

### Core attribute keys

The first core governed attribute key is `schema.substrait_primitive_kind`, emitted from local inspection when an output field has a known primitive kind. Additional core keys must use an `inql.` or similarly explicit namespace when they describe InQL-owned evidence. User, catalog, policy, and imported artifact keys may use their own namespaces, but InQL must preserve their source and authority rather than silently treating them as core facts.

### First propagation rules

The first propagation rule is conservative schema evidence propagation from inspection metadata into field-scoped governed attributes. The emitted attributes use `GovernedAttributeSource.Lineage`, `GovernedAttributeConfidence.Exact`, and `GovernedAttributeStatus.Inferred` because they come from local plan/schema evidence rather than external authority. InQL must not fabricate policy, catalog, masking, jurisdiction, or classification attributes from name heuristics alone.

### Serialization boundary

Governed attributes and policy checkpoints are local evidence records in the first implementation. Portable plan artifacts and governed bundles may include them when their owning RFCs define the artifact shape. RFC 035 does not require embedding policy checkpoints into Substrait metadata, because Substrait metadata may be ignored by consumers and must not be the only carrier for correctness-relevant governance evidence.

## Implementation Plan

### Phase 1: Record model and helpers

- Add governed attribute scope/source/confidence/status enums.
- Add policy checkpoint phase/action enums.
- Add typed `GovernedAttribute` and `PolicyCheckpoint` records with helper constructors and modifier methods.

### Phase 2: Inspection carriage

- Extend `PlanInspection` with governed attribute and policy checkpoint lists.
- Convert inspection-derived schema metadata into conservative governed attributes.
- Add a local planning checkpoint that records observed governed evidence without implying policy enforcement.
- Include governed evidence families in deterministic inspection artifact summaries.

### Phase 3: Docs and tests

- Add focused helper tests.
- Extend inspection tests for governed evidence and artifact counts.
- Update reference/how-to docs, release notes, and RFC lifecycle state.

## Progress Checklist

### Spec / design

- [x] Resolve reserved core attribute-key policy.
- [x] Resolve first propagation rules.
- [x] Resolve local-vs-portable serialization boundary.

### Package API

- [x] Add governed attribute enums and model.
- [x] Add policy checkpoint enums and model.
- [x] Add helper constructors and modifier methods.
- [x] Export public governance records and helpers through `pub::inql`.

### Inspection

- [x] Add governed attributes to `PlanInspection`.
- [x] Add policy checkpoints to `PlanInspection`.
- [x] Emit conservative schema-derived governed attributes.
- [x] Emit planning observation checkpoints without enforcement semantics.
- [x] Include governed evidence families in artifact summaries.

### Tests

- [x] Add focused governed attribute and policy checkpoint helper tests.
- [x] Extend inspection tests for governed attributes, policy checkpoints, and artifact counts.

### Docs

- [x] Add governed evidence reference docs.
- [x] Add governed evidence how-to docs.
- [x] Update inspection docs and release notes.
