# Local inspection (Reference)

Local inspection exposes structured evidence records for Prism-backed lazy plans without executing the plan or binding a backend. The first implementation slice covers `LazyFrame[T]` because that carrier owns Prism state today; `DataFrame[T]` and `DataStream[T]` still converge at the Substrait boundary through their documented carrier paths.

## Entry points

```incan
from pub::inql import inspect_plan, inspect_lineage

inspection = inspect_plan(summary)
lineage = inspect_lineage(summary)
```

`inspect_plan(data)` returns a `PlanInspection` record. `inspect_lineage(data)` returns the `LineageGraph` from the same inspection path.

## Evidence records

The inspection surface exposes these core record families:

| Record | Purpose |
| ------ | ------- |
| `SemanticTarget` | Stable local anchor for a plan, Prism node, relation output, field, read root, or future evidence family. |
| `PlanInspection` | Top-level inspection result with schema version, InQL version, plan target, output schema, output fields, Prism nodes, lineage, artifacts, diagnostics, and unsupported-evidence markers. |
| `LineageGraph` | Plan-local lineage graph with a rule version and typed lineage edges. |
| `LineageEdge` | Source-to-destination edge with relationship kind, transformation kind, confidence, expression reference, and evidence references. |
| `MetadataAttachment` | Typed attachment record for schema-versioned metadata payloads. The first inspection slice emits public version attachments and concrete output-field primitive-kind attachments when known. |
| `InspectionArtifact` | Deterministic summary for artifact families such as plan graph, lineage graph, schema flow, metadata attachments, diagnostics, and unsupported evidence. |
| `UnsupportedEvidence` | Explicit marker for evidence families that are not computed by this inspection path. |

## Target identity

Semantic targets use deterministic local IDs scoped to one Prism store/tip snapshot. Field targets include the node id and ordinal as well as the display name, so duplicate names and aliases are not treated as identity by name alone.

Plan IDs are local evidence IDs, not global catalog identities. They are stable for one inspected lazy plan value and should not be treated as organization-wide asset identifiers.

## Lineage

The first Prism lineage extractor records:

- read-root value lineage into read fields
- passthrough value lineage for filters, ordering, limits, windows, and generators that preserve input columns
- control lineage from filter predicate fields to the filtered relation output
- join lineage from join predicate fields to the joined relation output
- grouping lineage from group expressions to grouped output fields
- aggregate value lineage from aggregate inputs to measure outputs
- generator lineage from generator inputs to generated output fields
- window lineage from function arguments, partition expressions, and ordering expressions to window outputs
- sort lineage from ordering expressions to sorted relation outputs

Lineage confidence is `Exact` when the extractor can resolve a dependency to a known input field, and `Conservative` when the dependency name cannot be matched in the current schema. Unsupported lineage is not represented as an empty graph; unsupported evidence families are listed separately.

## Example

```incan
from pub::inql import LazyFrame, aggregate_as, col, eq, inspect_plan, str_lit, sum
from models import Order

def inspect_paid_spend(orders: LazyFrame[Order]) -> None:
    summary = orders
        .filter(eq(col("status"), str_lit("paid")))
        .group_by([col("customer_id")])
        .agg([aggregate_as(sum(col("amount")), "total_amount")])

    inspection = inspect_plan(summary)
    assert inspection.output_fields[0].name == "customer_id"
    assert inspection.output_fields[1].name == "total_amount"
    assert len(inspection.lineage.edges) > 0
```

## Current limits

Inspection is read-only and plan-local. It does not execute the plan, inspect DataFusion physical plans, read catalog metadata, emit files, or make governance decisions.

The first implementation computes local Prism plan graph, schema flow, lineage graph, public version/schema metadata attachments, diagnostics shape, and unsupported-evidence markers. Semantic profiles, ingress mappings, client-session context, frontend coverage, execution observations, adapter coverage, quality observations, policy checkpoints, governed bundles, and external exchange bridges remain owned by their RFCs and are not silently inferred by this API.
