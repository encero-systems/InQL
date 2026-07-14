# Exchange evidence locally

Use evidence exchange bridges when an IncQL plan bundle needs to leave IncQL as a reviewable artifact, or when an external artifact should be preserved as evidence input without becoming IncQL's source of truth.

## Export a native bundle summary

```incan
from pub::incql import bundle_summary_exchange, governed_plan_bundle

bundle = governed_plan_bundle(summary)
exchange = bundle_summary_exchange(bundle)
exchange.write("target/incql/bundle-exchange.json")?
```

The native bundle summary is the least lossy exchange. It preserves the bundle id, schema versions, section availability, record counts, evidence references, and output/lineage summary counts.

## Project OpenLineage-shaped records

```incan
from pub::incql import openlineage_exchange

openlineage = openlineage_exchange(bundle)

for loss in openlineage.losses:
    println(f"{loss.field_path}: {loss.reason}")
```

OpenLineage-shaped exchange records include job, run, dataset, and lineage-facet records. The bridge also emits loss records because IncQL lineage distinguishes relationship and transformation dimensions that OpenLineage cannot always carry directly without extensions or a sidecar.

## Project telemetry-shaped records

```incan
from pub::incql import telemetry_exchange

telemetry = telemetry_exchange(bundle)

for record in telemetry.records:
    println(f"{record.kind.value()} {record.external_name}")
```

Telemetry exchange emits a bundle-level event and adds event or metric records for supplied execution observations, quality observations, and adapter coverage records. It does not configure an OpenTelemetry exporter or send data over the network.

## Generate transformation-project suggestions

```incan
from pub::incql import transformation_project_exchange

suggestions = transformation_project_exchange(bundle)
```

Transformation-project exchange emits reviewable source, model, and quality-test suggestions. These records are intentionally generic, so they can be translated into dbt-shaped YAML, notebook checks, migration review artifacts, or another transformation stack by downstream tooling. The suggestions are not proof that the external project already implements the IncQL plan.

## Preserve inbound artifact identity

```incan
from pub::incql import (
    EvidenceExchangeTargetFormat,
    ExternalEvidenceConfidence,
    external_evidence_artifact,
    external_evidence_exchange,
)

manifest = external_evidence_artifact(
    "artifact:manifest:orders",
    EvidenceExchangeTargetFormat.TransformationProject,
    "target/dbt/manifest.json",
    target_format_version=Some("dbt-manifest-v12"),
    source_fingerprint=Some("sha256:..."),
    confidence=ExternalEvidenceConfidence.Attested,
)

incoming = external_evidence_exchange(manifest)
```

Inbound artifact exchange keeps source URI, format, version, fingerprint, confidence, diagnostics, and evidence references. It does not create lineage, coverage, policy, or quality pass/fail evidence by itself. A concrete parser bridge can interpret the artifact and emit typed evidence records, but that interpretation must carry its own diagnostics and confidence.

## Use exchange artifacts in review

Typical local review flow:

1. Build or inspect a plan.
2. Package a governed plan bundle.
3. Export native, lineage, telemetry, or transformation-project exchange artifacts.
4. Review `mapping_coverage`, `unsupported_fields`, and `losses`.
5. Pass the exchange JSON to catalog, CI, migration, or governance tooling that understands the selected profile.

The exchange JSON is a handoff artifact. Keep the original IncQL bundle available when a target format is lossy.
