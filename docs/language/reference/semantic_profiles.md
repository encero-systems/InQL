# Interoperability semantic profiles (Reference)

Semantic profiles describe the environment a plan is authored for, compared with, executed under, or exchanged with. They are evidence context. They do not replace Prism, Substrait, adapter requirements, coverage records, execution observations, or governed bundles.

## Entry points

```incan
from pub::inql import (
    inql_baseline_profile,
    adapter_binding_profile,
    execution_engine_profile,
    sql_dialect_profile,
    catalog_schema_profile,
    transformation_project_profile,
    interchange_consumer_profile,
    conformance_baseline_profile,
    semantic_dimension,
    assess_profile_for_target,
    coverage_record_for_profile,
)
```

| API | Input | Output |
| --- | ----- | ------ |
| `semantic_dimension(...)` | dimension kind, behavior, state, source, confidence | `SemanticProfileDimension` |
| `semantic_profile(...)` | target class, profile name, version/configuration, dimensions | `SemanticProfile` |
| `inql_baseline_profile(...)` | optional version and evidence references | `SemanticProfile` |
| `adapter_binding_profile(...)` | adapter name/version/configuration and dimensions | `SemanticProfile` |
| `execution_engine_profile(...)` | engine name/version/configuration and dimensions | `SemanticProfile` |
| `sql_dialect_profile(...)` | dialect name/version and dimensions | `SemanticProfile` |
| `catalog_schema_profile(...)` | catalog/schema name/version and dimensions | `SemanticProfile` |
| `transformation_project_profile(...)` | project name/version and dimensions | `SemanticProfile` |
| `interchange_consumer_profile(...)` | consumer name/version and dimensions | `SemanticProfile` |
| `conformance_baseline_profile(...)` | baseline name/version and dimensions | `SemanticProfile` |
| `assess_profile_for_target(...)` | plan target and profile | `SemanticProfileAssessment` |
| `profile_assessment(...)` | explicit target, profile id, dimensions, and state | `SemanticProfileAssessment` |
| `coverage_record_for_profile(...)` | adapter coverage record and profile | `AdapterCoverageRecord` with `semantic_profile_id` set |

## Record types

| Record | Purpose |
| ------ | ------- |
| `SemanticProfile` | Versioned evidence context for an external or internal semantic environment. |
| `SemanticProfileDimension` | One structured semantic dimension such as temporal behavior, function identity, or catalog semantics. |
| `SemanticProfileAssessment` | Assessment of a plan target under a profile. |

The current schema identifier is `SEMANTIC_PROFILE_SCHEMA_VERSION`.

## Enums

| Enum | Values |
| ---- | ------ |
| `SemanticProfileTargetClass` | `InqlBaseline`, `ClientProtocol`, `PlanIngressFrontend`, `ExecutionEngine`, `AdapterBinding`, `SqlDialect`, `CatalogSchemaSystem`, `TransformationProject`, `InterchangeConsumer`, `ConformanceBaseline` |
| `SemanticProfileDimensionKind` | `TypeSystem`, `NumericDecimal`, `TemporalCalendar`, `BooleanNullNan`, `StringComparison`, `IdentifierResolution`, `SchemaCatalog`, `TransformationProject`, `ClientSessionState`, `RelationOrdering`, `AggregateGrouping`, `WindowSemantics`, `NestedSemiStructured`, `FunctionOperatorIdentity`, `ExtensionFallback`, `PlanStageObservability` |
| `SemanticProfileDimensionState` | `Exact`, `Constrained`, `Unknown`, `NotApplicable` |
| `SemanticProfileConfidence` | `Declared`, `Attested`, `Observed`, `Inferred`, `Unknown` |
| `SemanticProfileAssessmentState` | `Matched`, `Constrained`, `Mismatched`, `Unknown`, `NotApplicable` |

## `SemanticProfile`

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `schema_version` | `str` | Semantic profile schema identifier. |
| `profile_id` | `str` | Deterministic local profile id. |
| `target_class` | `SemanticProfileTargetClass` | Semantic environment class. |
| `profile_name` | `str` | Environment, family, tool, dialect, or baseline name. |
| `source` | `MetadataSource` | Source family for the profile declaration. |
| `target_version` | `Option[str]` | External version or profile version when known. |
| `target_configuration_fingerprint` | `Option[str]` | Non-sensitive configuration fingerprint when available. |
| `dimensions` | `list[SemanticProfileDimension]` | Structured semantic dimensions carried by this profile. |
| `confidence` | `SemanticProfileConfidence` | Confidence attached to the profile. |
| `diagnostics` | `list[ExecutionDiagnostic]` | Profile-level diagnostics. |
| `evidence_refs` | `list[str]` | Evidence references supporting this profile. |

Methods:

| Method | Output | Meaning |
| ------ | ------ | ------- |
| `profile.to_json_value()` | `JsonValue` | Stable JSON summary value. |
| `profile.to_json_text()` | `Result[str, IoError]` | Pretty JSON summary text. |
| `profile.write(path)` | `Result[None, IoError]` | Write the JSON summary to a local path. |

## Assessments

`assess_profile_for_target(plan_target, profile)` conservatively combines the profile's dimension states. Any `Unknown` dimension keeps the assessment `Unknown`; any `Constrained` dimension makes the assessment `Constrained`; exact dimensions can produce `Matched`; and not-applicable-only dimensions produce `NotApplicable`. This prevents missing profile evidence from being treated as compatibility.

Use `profile_assessment(...)` when a caller has stronger evidence, explicit mismatch diagnostics, or a precomputed assessment state.

## Bundle and coverage integration

`governed_plan_bundle(...)` and `governed_plan_bundle_from_inspection(...)` accept `semantic_profiles` and `profile_assessments`. Bundles expose `semantic_profiles` and `profile_assessments` sections and include `SEMANTIC_PROFILE_SCHEMA_VERSION` in `rule_versions` when profile evidence is present.

`coverage_record_for_profile(record, profile)` sets `record.semantic_profile_id` on a copied coverage record. It does not change the coverage state; it only records which semantic profile was used for the coverage answer.

For a task-oriented workflow, see [Use semantic profiles in evidence](../how-to/semantic_profiles.md).
