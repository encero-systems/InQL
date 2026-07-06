# Evidence exchange bridges (Reference)

Evidence exchange bridges turn InQL evidence into local handoff artifacts, or preserve external artifacts as typed evidence inputs. They do not make external systems the semantic owner of InQL plans, lineage, quality, coverage, or governance evidence.

## Entry points

```incan
from pub::inql import (
    bundle_summary_exchange,
    openlineage_exchange,
    telemetry_exchange,
    transformation_project_exchange,
    external_evidence_artifact,
    external_evidence_exchange,
)
```

| API | Input | Output |
| --- | ----- | ------ |
| `bundle_summary_exchange(bundle)` | `GovernedPlanBundle` | `EvidenceExchangeArtifact` |
| `openlineage_exchange(bundle)` | `GovernedPlanBundle` | `EvidenceExchangeArtifact` |
| `telemetry_exchange(bundle)` | `GovernedPlanBundle` | `EvidenceExchangeArtifact` |
| `transformation_project_exchange(bundle)` | `GovernedPlanBundle` | `EvidenceExchangeArtifact` |
| `external_evidence_artifact(...)` | external artifact identity fields | `ExternalEvidenceArtifact` |
| `external_evidence_exchange(artifact)` | `ExternalEvidenceArtifact` | `EvidenceExchangeArtifact` |

`bundle_summary_exchange(...)` is a native InQL summary bridge. `openlineage_exchange(...)` and `telemetry_exchange(...)` produce OpenLineage-shaped and OpenTelemetry-shaped local records. `transformation_project_exchange(...)` produces generic source, model, and test suggestions for transformation-project workflows. The inbound external artifact helpers preserve artifact identity, source URI, fingerprint, confidence, diagnostics, and evidence references without importing those artifacts as authoritative InQL semantics.

## Record types

| Record | Purpose |
| ------ | ------- |
| `EvidenceExchangeArtifact` | Top-level exchange handoff artifact. |
| `EvidenceExchangeProfile` | Mapping profile for one bridge direction and target format. |
| `EvidenceExchangeRecord` | One projected or imported exchange record. |
| `EvidenceExchangeLoss` | Explicit lossy mapping note for one field or evidence dimension. |
| `ExternalEvidenceArtifact` | Identity and provenance for an imported external artifact. |

The current schema identifier is `EVIDENCE_EXCHANGE_SCHEMA_VERSION`.

## Enums

| Enum | Values |
| ---- | ------ |
| `EvidenceExchangeDirection` | `Inbound`, `Outbound` |
| `EvidenceExchangeTargetFormat` | `InqlBundleSummary`, `OpenLineage`, `OpenTelemetry`, `TransformationProject`, `CatalogMetadata`, `DataContract`, `DataProduct`, `EvidenceGraph`, `Sidecar`, `ExternalArtifact` |
| `EvidenceExchangeMappingCoverage` | `Complete`, `Partial`, `Lossy`, `Unsupported` |
| `EvidenceExchangeRedactionMode` | `PreserveVisibility`, `PublicOnly`, `RedactSensitive`, `SidecarOnly` |
| `EvidenceExchangeRecordKind` | bundle, OpenLineage, telemetry, transformation suggestion, and external artifact record kinds |
| `ExternalEvidenceConfidence` | `Declared`, `Attested`, `Observed`, `Inferred`, `Unknown` |

## `EvidenceExchangeArtifact`

| Field | Type | Meaning |
| ----- | ---- | ------- |
| `schema_version` | `str` | Exchange artifact schema identifier. |
| `exchange_id` | `str` | Deterministic local exchange id. |
| `direction` | `EvidenceExchangeDirection` | Inbound input or outbound projection. |
| `target_format` | `EvidenceExchangeTargetFormat` | Target format family. |
| `profile` | `EvidenceExchangeProfile` | Mapping profile used for this artifact. |
| `source_bundle_id` | `Option[str]` | Source bundle id for outbound bundle-derived exchanges. |
| `records` | `list[EvidenceExchangeRecord]` | Projected or imported records. |
| `losses` | `list[EvidenceExchangeLoss]` | Explicit lossy mapping notes. |
| `external_artifacts` | `list[ExternalEvidenceArtifact]` | Imported artifact identities. |
| `diagnostics` | `list[ExecutionDiagnostic]` | Exchange-level diagnostics. |
| `evidence_refs` | `list[str]` | Evidence references carried into the exchange. |

Methods:

| Method | Output | Meaning |
| ------ | ------ | ------- |
| `exchange.to_json_value()` | `JsonValue` | Stable JSON summary value. |
| `exchange.to_json_text()` | `Result[str, IoError]` | Pretty JSON summary text. |
| `exchange.write(path)` | `Result[None, IoError]` | Write the JSON summary to a local path. |

## Mapping coverage and loss

Mapping coverage is explicit. A native InQL bundle summary can be `Complete`; an OpenLineage-shaped projection is currently `Lossy` because OpenLineage does not natively distinguish every InQL lineage relationship and transformation dimension. Transformation-project suggestions and telemetry projections are `Partial` because they are review artifacts, not complete external project definitions or managed telemetry exports.

Lossy bridges must emit `EvidenceExchangeLoss` records instead of silently dropping semantic dimensions. Consumers can use those records to decide whether to inspect the InQL sidecar artifact, require manual review, or reject the exchange.

## Boundary

Exchange artifacts are local files or values. Provider configuration, authentication, network transport, hosted ingestion, sampling, dashboards, and managed governance behavior are outside this API.

For a task-oriented workflow, see [Exchange evidence locally](../how-to/evidence_exchange.md).
