# Governed plan bundles (Reference)

Governed plan bundles package local IncQL evidence for one planned relation. They keep the rich typed records in memory and expose a stable JSON summary for handoff tools that need to understand which evidence families are present, unavailable, or unsupported.

## Entry points

```incan
from pub::incql import governed_plan_bundle, governed_plan_bundle_from_inspection

bundle = governed_plan_bundle(summary)
bundle_from_existing_inspection = governed_plan_bundle_from_inspection(inspection)
```

| API | Input | Output |
| --- | ----- | ------ |
| `governed_plan_bundle(data)` | `LazyFrame[T]` plus optional evidence lists | `GovernedPlanBundle` |
| `governed_plan_bundle_from_inspection(inspection)` | `PlanInspection` plus optional evidence lists | `GovernedPlanBundle` |

Both entry points accept optional `quality_assertions`, `quality_observations`, `execution_observations`, `coverage_records`, `semantic_profiles`, `profile_assessments`, `ingress_evidence`, `verification_evidence`, and `evidence_refs` arguments. `governed_plan_bundle(...)` runs local plan inspection first. `governed_plan_bundle_from_inspection(...)` is for callers that already inspected the plan and want to avoid redoing that work.

## Record types

| Record | Purpose |
| ------ | ------- |
| `GovernedPlanBundle` | Top-level local evidence package for one planned relation. |
| `BundleEvidenceSection` | Evidence-family section state with requirement, availability, record count, reason, and evidence references. |
| `BundleSectionRequirement` | `Required` or `Optional`. |
| `BundleSectionAvailability` | `Available`, `Unavailable`, or `Unsupported`. |
| `BundleExportStatus` | Local export state. Bundles created by IncQL start as `Local`. |

`GOVERNED_PLAN_BUNDLE_SCHEMA_VERSION` is the current schema identifier for the stable bundle summary shape.

## Bundle contents

`GovernedPlanBundle` contains:

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `schema_version` | `str` | Bundle schema identifier. |
| `incql_version` | `str` | IncQL package version observed by inspection. |
| `bundle_id` | `str` | Stable local bundle id derived from the inspected plan id. |
| `rule_versions` | `list[str]` | Bundle, inspection, and lineage rule versions that shaped the bundle. |
| `plan_target` | `SemanticTarget` | Plan-level semantic target. |
| `root_target` | `SemanticTarget` | Authored Prism root target for the inspected plan. |
| `input_schema_references` | `list[str]` | Local references to discovered read-root schema sources. |
| `output_schema` | `list[ScalarColumnSpec]` | Output schema from inspection. |
| `output_fields` | `list[SemanticTarget]` | Output field targets from inspection. |
| `lineage` | `LineageGraph` | Prism lineage graph. |
| `attachments` | `list[MetadataAttachment]` | Typed metadata attachments from inspection. |
| `governed_attributes` | `list[GovernedAttribute]` | Governed attributes from inspection or future callers. |
| `policy_checkpoints` | `list[PolicyCheckpoint]` | Policy checkpoint records from inspection or future callers. |
| `quality_assertions` | `list[QualityAssertion]` | Caller-supplied quality declarations included in the bundle. |
| `quality_observations` | `list[QualityObservation]` | Caller-supplied quality observations included in the bundle. |
| `execution_observations` | `list[ExecutionObservation]` | Caller-supplied execution observations included in the bundle. |
| `adapter_requirements` | `list[AdapterRequirement]` | Inspection-inferred adapter requirements. |
| `coverage_records` | `list[AdapterCoverageRecord]` | Caller-supplied adapter coverage records included in the bundle. |
| `semantic_profiles` | `list[SemanticProfile]` | Caller-supplied semantic profiles included in the bundle. |
| `profile_assessments` | `list[SemanticProfileAssessment]` | Caller-supplied semantic profile assessments included in the bundle. |
| `ingress_evidence` | `list[IngressEvidence]` | Caller-supplied frontend ingress evidence included in the bundle. |
| `verification_evidence` | `list[VerificationEvidence]` | Caller-supplied async verification evidence included in the bundle. |
| `unsupported_evidence` | `list[UnsupportedEvidence]` | Inspection markers for evidence families not computed by the inspection path. |
| `sections` | `list[BundleEvidenceSection]` | Deterministic section summaries for local and reserved evidence families. |
| `evidence_refs` | `list[str]` | Caller-supplied external or local evidence references. |
| `export_status` | `BundleExportStatus` | Local export state. |

## Section contract

Sections are the compatibility surface for consumers that do not understand every typed record family. Consumers should inspect `section.availability`, not only `section.record_count`.

| Availability | Meaning |
| ------------ | ------- |
| `Available` | IncQL computed or the caller supplied the section evidence. `record_count` may still be zero when an empty computed result is meaningful. |
| `Unavailable` | The family is supported by this bundle surface, but no evidence was supplied or discovered for this bundle. |
| `Unsupported` | The RFC series reserves the family, but this IncQL implementation does not produce that family yet. |

Required sections cover the local core evidence IncQL can produce today: plan target, input schema references, output schema, output fields, lineage graph, metadata attachments, governed attributes, policy checkpoints, adapter requirements, and unsupported-evidence markers. Optional sections cover caller-provided execution, quality, coverage, semantic profiles, profile assessments, ingress requests, ingress mappings, frontend coverage, ingress diagnostics, verification assertions, verification runs, verification observations, verification projections, verification snapshots, verification commitments, verification waivers, Substrait artifact references, and reserved evidence families such as canonical equality profiles, proof artifacts, constraint evidence, data contract evidence, product topology, semantic evidence graph projections, and exchange bridges.

## Methods

| Method | Output | Meaning |
| ------ | ------ | ------- |
| `bundle.section(family)` | `Option[BundleEvidenceSection]` | Return one section by family name. |
| `bundle.section_available(family)` | `bool` | Return whether the section exists and is available. |
| `bundle.to_json_value()` | `JsonValue` | Return the stable JSON summary as a dynamic JSON value. |
| `bundle.to_json_text()` | `Result[str, IoError]` | Serialize the stable JSON summary as pretty JSON text. |
| `bundle.write(path)` | `Result[None, IoError]` | Write the stable JSON summary to a filesystem path. |

The JSON summary intentionally contains metadata, counts, section states, input schema references, and evidence references. It does not flatten every rich typed record into JSON. Consumers that need the full in-memory record graph should use the typed `GovernedPlanBundle` value directly or use evidence exchange artifacts for handoff formats.

## Current limits

Bundles are local evidence packages. They do not approve policy decisions, create a hosted evidence graph, publish to a control plane, or prove execution correctness. The current implementation does not embed a Substrait plan artifact by default. Verification evidence is a concrete optional section when callers provide RFC 042 records; reserved families such as canonical equality profiles, proof artifacts, constraint evidence, data contract evidence, and semantic graph projections are marked as `Unsupported` until their owning RFCs provide concrete record surfaces.

For a task-oriented workflow, see [Package a governed plan bundle](../how-to/governed_plan_bundles.md).
