# Local inspection (Reference)

Local inspection exposes structured evidence records for Prism-backed lazy plans without executing the plan or binding a backend. The first implementation slice covers `LazyFrame[T]` because that carrier owns Prism state today; `DataFrame[T]` and `DataStream[T]` still converge at the Substrait boundary through their documented carrier paths.

## Entry points

```incan
from pub::incql import inspect_plan, inspect_lineage

inspection = inspect_plan(summary)
lineage = inspect_lineage(summary)
```

`inspect_plan(data)` returns a `PlanInspection` record. `inspect_lineage(data)` returns the lineage graph directly from the same Prism-authored plan state when callers do not need the full inspection record.

## Evidence records

The inspection surface consumes shared evidence record families and adds the local `PlanInspection` wrapper around them:

| Record | Purpose |
| ------ | ------- |
| `SemanticTarget` | Stable local anchor for a plan, Prism node, relation output, field, read root, or future evidence family. |
| `PlanInspection` | Top-level inspection result with schema version, IncQL version, plan target, output schema, output fields, Prism nodes, lineage, artifacts, diagnostics, and unsupported-evidence markers. |
| `InspectionNodeKind` | Typed public node-kind vocabulary for authored and rewritten Prism node inspection records. |
| `LineageGraph` | Plan-local lineage graph with a rule version and typed lineage edges. |
| `LineageEdge` | Source-to-destination edge with relationship kind, transformation kind, confidence, expression reference, and evidence references. |
| `MetadataAttachment` | Typed attachment record for schema-versioned metadata payloads. The first inspection slice emits public version attachments and concrete output-field primitive-kind attachments when known. |
| `GovernedAttribute` | Governed fact attached to a semantic target with provenance, confidence, status, authority, lifetime, and evidence references. Inspection currently emits conservative schema primitive-kind attributes for known output fields. |
| `PolicyCheckpoint` | Policy decision or observation record attached to a semantic target. Inspection records local planning observation checkpoints without enforcing policy. |
| `AdapterRequirement` | Capability requirement inferred from plan evidence, such as row filtering, ordered execution, extension functions, variant semantics, baseline null semantics, or lineage-preservation evidence. |
| `InspectionArtifact` | Deterministic summary for artifact families such as plan graph, lineage graph, schema flow, metadata attachments, diagnostics, and unsupported evidence. |
| `UnsupportedEvidence` | Explicit marker for evidence families that are not computed by this inspection path. |

## Target identity

Semantic targets use deterministic local IDs scoped to one Prism store/tip snapshot. Field targets include the node id and ordinal as well as the display name, so duplicate names and aliases are not treated as identity by name alone. `node_id` and `ordinal` are optional fields: plan-level targets do not carry Prism positions, relation-output targets carry a node id without a field ordinal, and field targets carry both.

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

Lineage confidence is `Exact` when the extractor can resolve a dependency to exactly one known input field, and `Conservative` when the dependency name cannot be matched or is ambiguous in the current schema. Scalar function calls preserve argument dependencies, but their transformation kind is `Unknown` unless the node kind supplies a more specific relationship such as filter, join, aggregate, generator, window, or sort. Unsupported lineage is not represented as an empty graph; unsupported evidence families are listed separately.

## Current limits

Inspection is read-only and plan-local. It does not execute the plan, inspect DataFusion physical plans, read catalog metadata, emit files, or make governance decisions.

The current implementation computes local Prism plan graph, schema flow, lineage graph, inferred adapter requirements, public version/schema metadata attachments, governed attributes, policy checkpoint observations, diagnostics shape, and unsupported-evidence markers. Session execution observations and adapter coverage evaluation are exposed through the execution context rather than through plan inspection. Semantic profiles, ingress mappings, client-session context, frontend coverage, quality observations, governed bundles, and external exchange bridges remain owned by their RFCs and are not silently inferred by this API.

For a task-oriented workflow, see [Inspect a plan and lineage graph](../how-to/inspect_plan_lineage.md).
