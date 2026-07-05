# Governed attributes and policy checkpoints (Reference)

This page documents the current governed-evidence surface in the InQL package. Normative design intent lives in [RFC 035][rfc-035].

Governed attributes are typed evidence records attached to semantic targets. They can describe facts such as classification, origin, purpose, jurisdiction, masking state, or schema-derived field facts. A governed attribute records where the fact came from, how confident InQL or a caller is in it, whether it is asserted or inferred, which authority supplied or reviewed it, and which evidence references support it.

Policy checkpoints are decision records attached to semantic targets at authoring, planning, binding, or execution boundaries. They record that a policy result was observed, warned, denied, required approval, requested masking, or required another check. They do not define a policy language and they do not enforce behavior by themselves.

## Entry points

```incan
from pub::inql import governed_attribute, policy_checkpoint
```

| Helper | Signature | Purpose |
| ------ | --------- | ------- |
| `governed_attribute` | `def governed_attribute(target, key, value, value_schema = "inql.governance.string.v0.1", scope = GovernedAttributeScope.Field, source = GovernedAttributeSource.Inferred, confidence = GovernedAttributeConfidence.Unknown, status = GovernedAttributeStatus.Inferred, authority = None, observed_at_unix_nanoseconds = None, expires_at_unix_nanoseconds = None, evidence_refs = []) -> GovernedAttribute` | Build one governed fact attached to a semantic target. |
| `policy_checkpoint` | `def policy_checkpoint(target, checkpoint, action, policy_ref, reason_code, evidence_refs = [], visibility = MetadataVisibility.Public, diagnostics = []) -> PolicyCheckpoint` | Build one policy decision or observation record attached to a semantic target. |

## Records

| Record | Purpose |
| ------ | ------- |
| `GovernedAttribute` | One governed fact attached to a semantic target with provenance, confidence, status, authority, lifetime, and evidence references. |
| `PolicyCheckpoint` | One policy decision or observation attached to a semantic target with checkpoint phase, action, policy reference, reason code, visibility, diagnostics, and evidence references. |

`GovernedAttribute.value` is a `MetadataPayload` with a schema and compact string value. The default helper shape is intentionally compact: inspection-derived primitive-kind attributes use `inql.governance.schema-primitive-kind.v0.1` to distinguish governed schema evidence from generic metadata strings. Catalog, contract, exchange, or policy-ingress steps can normalize richer external formats before they become governed attributes.

`GovernedAttribute` exposes convenience methods:

| Method | Purpose |
| ------ | ------- |
| `with_status(status)` | Return the same attribute identity with a different status. |
| `with_confidence(confidence)` | Return the same attribute identity with a different confidence level. |
| `with_authority(authority)` | Return the same attribute identity with an authority reference. |
| `with_lifetime(observed_at, expires_at)` | Return the same attribute identity with observation and expiration timestamps. |

`PolicyCheckpoint.with_visibility(visibility)` returns the same checkpoint with a different visibility policy.

## Enumerations

| Enum | Values |
| ---- | ------ |
| `GovernedAttributeScope` | `Field`, `Relation`, `Expression`, `Plan`, `Output`, `ExecutionPath` |
| `GovernedAttributeSource` | `Model`, `User`, `Lineage`, `Catalog`, `Policy`, `Adapter`, `ImportedArtifact`, `Inferred` |
| `GovernedAttributeConfidence` | `Exact`, `High`, `Medium`, `Low`, `Unknown` |
| `GovernedAttributeStatus` | `Asserted`, `Inferred`, `Accepted`, `Rejected`, `Overridden`, `Stale`, `PendingReview` |
| `PolicyCheckpointKind` | `Authoring`, `Planning`, `Binding`, `Execution` |
| `PolicyCheckpointAction` | `Allow`, `Deny`, `Redact`, `Mask`, `RowFilter`, `Warn`, `RequireQualityCheck`, `RequireApproval`, `Observe` |

## Inspection behavior

`inspect_plan(...)` now includes two governed-evidence fields:

| Field | Type | Current behavior |
| ----- | ---- | ---------------- |
| `governed_attributes` | `list[GovernedAttribute]` | Conservative field-level attributes inferred from local inspection evidence. When a field schema kind is known, inspection emits schema primitive-kind attributes. |
| `policy_checkpoints` | `list[PolicyCheckpoint]` | Local planning checkpoint records that make policy observation explicit without claiming enforcement. |

The corresponding `InspectionArtifact` families are `governed_attributes` and `policy_checkpoints`.

Inspection-derived governed attributes use `GovernedAttributeSource.Lineage`, `GovernedAttributeConfidence.Exact`, and `GovernedAttributeStatus.Inferred` for schema facts because they come from local plan/schema evidence, not from an external authority. Absence of an attribute is different from a rejected attribute, a stale attribute, or an unsupported evidence family.

## Boundary

InQL carries governed evidence. It does not decide legal obligations, own an organization policy language, approve changes, or enforce masking/row-filter behavior by itself. A caller may read `PolicyCheckpoint` and `GovernedAttribute` records and choose how to act, but that enforcement decision is outside the record semantics.

<!-- References -->

[rfc-035]: ../../rfcs/035_governed_attributes_policy_checkpoints.md
