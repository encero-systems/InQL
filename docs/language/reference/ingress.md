# Prism plan ingress (Reference)

Plan ingress records describe external client requests before Prism analyzes them into ordinary IncQL relational plans. They are not execution adapters, backend capabilities, or Substrait metadata. A frontend may decode Spark Connect, SQL, notebook, or API-client intent into ingress records; Prism remains the semantic owner once `analyze_ingress_plan(...)` produces a `LazyFrame`.

## Entry points

```incan
from pub::incql import (
    analyze_ingress_plan,
    client_session_context,
    ingress_aggregate,
    ingress_command,
    ingress_filter,
    ingress_group_by,
    ingress_limit,
    ingress_named_table,
    ingress_order_by,
    ingress_origin_reference,
    ingress_plan,
    ingress_request,
    ingress_select,
)
```

| API | Input | Output |
| --- | ----- | ------ |
| `ingress_request(...)` | frontend identity, protocol, kind, optional request/profile metadata | `IngressRequest` |
| `client_session_context(...)` | request plus client session facts | `ClientSessionContext` |
| `ingress_origin_reference(...)` | request, origin kind, external id/path, name | `IngressOriginReference` |
| `ingress_named_table(...)` | table name and optional origin | `IngressReadNamedTable` |
| `ingress_filter(...)` | decoded predicate expression and optional origin | `IngressFilter` |
| `ingress_select(...)` | projection assignments and optional origin | `IngressSelect` |
| `ingress_group_by(...)` | grouping expressions and optional origin | `IngressGroupBy` |
| `ingress_aggregate(...)` | aggregate measures and optional origin | `IngressAggregate` |
| `ingress_order_by(...)` | ordering expressions and optional origin | `IngressOrderBy` |
| `ingress_limit(...)` | row limit and optional origin | `IngressLimit` |
| `ingress_command(...)` | non-relational command kind, name, optional origin, evidence refs | `IngressCommand` |
| `ingress_plan(...)` | request, session context, relation steps, optional commands/profile/evidence refs | `IngressPlan` |
| `analyze_ingress_plan[T](plan)` | unresolved ingress plan | `IngressAnalysis[T]` |

## Record types

| Record | Purpose |
| ------ | ------- |
| `IngressRequest` | One external request entering IncQL through a frontend boundary. |
| `ClientSessionContext` | Client session facts that can affect frontend analysis. |
| `IngressOriginReference` | Mapping from an external protocol node to an IncQL evidence target. |
| `IngressDiagnostic` | Structured ingress diagnostic emitted before execution. |
| `IngressCoverageRecord` | Frontend coverage answer for one external protocol feature. |
| `IngressPlan` | Unresolved ingress request that Prism can analyze or reject. |
| `IngressEvidence` | Evidence emitted by one ingress analysis attempt. |
| `IngressAnalysis[T]` | Analysis result with status, optional `LazyFrame[T]`, and evidence. |

`INGRESS_SCHEMA_VERSION` is the current schema identifier for ingress evidence.

## Enums

| Enum | Values |
| ---- | ------ |
| `IngressFrontendKind` | `Generic`, `SparkConnect`, `Sql`, `Notebook`, `ApiClient` |
| `IngressOriginKind` | `Relation`, `Expression`, `Command` |
| `IngressCommandKind` | `SessionConfig`, `CatalogInspection`, `TemporaryView`, `CacheControl`, `ClientLifecycle`, `Unknown` |
| `IngressFeatureKind` | `ReadNamedTable`, `Filter`, `Select`, `GroupBy`, `Aggregate`, `OrderBy`, `Limit`, `Command`, `Join`, `Generator`, `Window`, `Unknown` |
| `IngressCoverageState` | `Supported`, `PartiallySupported`, `Unsupported`, `Unknown` |
| `IngressAnalysisStatus` | `Analyzed`, `Rejected`, `Unknown` |

## Supported analyzer shape

The core analyzer accepts a single-root, linear relation plan:

1. `ingress_named_table(...)`
2. zero or more supported transforms: `ingress_filter(...)`, `ingress_select(...)`, `ingress_group_by(...)`, `ingress_aggregate(...)`, `ingress_order_by(...)`, and `ingress_limit(...)`

The analyzer converts those relation steps into normal `LazyFrame` method calls. It emits supported frontend coverage records for analyzed relation features, preserves supplied origin references, assesses a requested semantic profile when present, and returns `IngressAnalysisStatus.Analyzed` with a `LazyFrame[T]` when the plan is executable.

Non-relational commands are represented as `IngressCommand` records. The current core analyzer rejects them before execution and emits both a diagnostic and unsupported command coverage. That behavior is intentional: command handling affects client session state, catalog behavior, or lifecycle semantics and should not be hidden inside a relational plan.

## Ingress evidence

`IngressEvidence` contains the request, session context, origin references, diagnostics, coverage records, profile assessments, and evidence refs for one analysis attempt. Consumers should inspect this evidence before executing or packaging a plan, especially when the request came from a compatibility frontend.

`IngressRequest.target()` returns a semantic target for the request. `ClientSessionContext.target()` returns a semantic target for the client session. Origin references carry their own targets so inspection and governed bundles can show how external protocol nodes map to IncQL evidence targets without letting external node ids replace Prism identity.

## Bundle integration

`governed_plan_bundle(...)` and `governed_plan_bundle_from_inspection(...)` accept an `ingress_evidence` argument. Bundles expose concrete section summaries for:

- `ingress_requests`
- `client_session_context`
- `ingress_mappings`
- `frontend_coverage`
- `ingress_diagnostics`

When ingress evidence is present, the bundle includes `INGRESS_SCHEMA_VERSION` in `rule_versions` and the section record counts reflect the supplied ingress evidence.

## Boundary rules

Ingress coverage is frontend-facing evidence. Adapter coverage is execution-facing evidence. A Spark Connect-shaped relation node being accepted by ingress analysis does not prove that a backend adapter can execute the resulting plan. Use adapter requirement and coverage APIs for execution readiness.

Plan ingress also does not make Spark, SQL, Substrait, DataFusion, or any other external system the owner of IncQL semantics. Frontends decode external intent; Prism performs IncQL analysis; session adapters execute analyzed plans.

For a task-oriented workflow, see [Analyze external frontend intent](../how-to/ingress.md).
