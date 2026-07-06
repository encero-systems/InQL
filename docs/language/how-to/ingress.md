# Analyze external frontend intent

Use ingress records when a local tool or frontend has already decoded external client intent and needs Prism to analyze that intent as InQL. The examples here model a Spark Connect-shaped request, but the same records can describe SQL, notebook, or API-client frontends.

## Create request and session context

```incan
from pub::inql import (
    IngressFrontendKind,
    client_session_context,
    ingress_request,
)

request = ingress_request(
    "spark-connect-local",
    "spark-connect",
    frontend_kind=IngressFrontendKind.SparkConnect,
    request_id="ingress-request:orders-rollup",
    protocol_version=Some("3.5"),
    evidence_refs=["frontend:spark-connect-local"],
)

session_context = client_session_context(
    request,
    "client-session-1",
    current_catalog=Some("lakehouse"),
    current_namespace=Some("sales"),
    timezone=Some("UTC"),
    case_sensitive=Some(false),
)
```

The request identifies the frontend and protocol. The session context records analysis facts that can affect name resolution, function lookup, coercion behavior, timezone handling, or compatibility diagnostics. It is evidence context, not the execution adapter.

## Preserve origin references

```incan
from pub::inql import IngressOriginKind, ingress_origin_reference

orders_origin = ingress_origin_reference(
    request,
    IngressOriginKind.Relation,
    "rel-0",
    "relations/0",
    "orders",
)
```

Origin references map external protocol ids or paths to InQL evidence targets. They help inspection explain where a Prism target came from without making external ids the source of semantic identity.

## Analyze a supported relation plan

```incan
from pub::inql import (
    IngressAnalysis,
    aggregate_as,
    analyze_ingress_plan,
    col,
    desc,
    eq,
    ingress_aggregate,
    ingress_filter,
    ingress_group_by,
    ingress_limit,
    ingress_named_table,
    ingress_order_by,
    ingress_plan,
    sum,
)

plan = ingress_plan(
    request,
    session_context,
    [
        ingress_named_table("orders", origin=Some(orders_origin)),
        ingress_filter(eq(col("status"), "paid")),
        ingress_group_by([col("customer_id")]),
        ingress_aggregate([aggregate_as(sum(col("amount")), "total_amount")]),
        ingress_order_by([desc(col("total_amount"))]),
        ingress_limit(10),
    ],
)

analysis: IngressAnalysis[OrderSummary] = analyze_ingress_plan[OrderSummary](plan)

match analysis.plan:
    Some(summary) => println(summary.planned_columns())
    None => println("ingress plan was rejected before execution")
```

The analyzed plan is an ordinary `LazyFrame[OrderSummary]`. Downstream inspection, bundle, Substrait, and session execution paths do not need a separate Spark or SQL planning lane.

## Check coverage and diagnostics

```incan
for coverage in analysis.evidence.coverage_records:
    println(f"{coverage.feature.value()} -> {coverage.state.value()}")

for diagnostic in analysis.evidence.diagnostics:
    println(f"{diagnostic.code}: {diagnostic.message}")
```

Supported relation steps emit `Supported` frontend coverage. Unsupported commands or malformed relation order emit diagnostics and reject analysis before execution.

## Attach a semantic profile

```incan
from pub::inql import IngressAnalysis, inql_baseline_profile

profiled_plan = ingress_plan(
    request,
    session_context,
    [ingress_named_table("orders")],
    requested_profile=Some(inql_baseline_profile("v0.1")),
)

profiled_analysis: IngressAnalysis[Order] = analyze_ingress_plan[Order](profiled_plan)
println(len(profiled_analysis.evidence.profile_assessments))
```

Profiles make compatibility assumptions explicit. They do not force compatibility by name; unknown profile dimensions remain unknown evidence.

## Package ingress evidence

```incan
from pub::inql import governed_plan_bundle_from_inspection, inspect_plan

match analysis.plan:
    Some(summary) =>
        bundle = governed_plan_bundle_from_inspection(
            inspect_plan(summary),
            ingress_evidence=[analysis.evidence],
        )
        println(bundle.section_available("ingress_mappings"))
        println(bundle.section_available("frontend_coverage"))
        println(bundle.section_available("client_session_context"))
    None => println("no plan to package")
```

Bundling ingress evidence keeps client-session context, origin mappings, coverage records, and diagnostics beside the normal inspection evidence. This is the preferred shape for local migration, governance, and review tools that need to explain how external authoring intent reached Prism.

## Handle commands deliberately

```incan
from pub::inql import IngressAnalysis, IngressCommandKind, ingress_command

command_plan = ingress_plan(
    request,
    session_context,
    [ingress_named_table("orders")],
    commands=[
        ingress_command(
            IngressCommandKind.CatalogInspection,
            "listCatalogs",
            evidence_refs=["client-command:listCatalogs"],
        ),
    ],
)

command_analysis: IngressAnalysis[Order] = analyze_ingress_plan[Order](command_plan)
assert !command_analysis.is_accepted(), "unsupported commands reject before execution"
```

Commands are evidence first. They should become explicit client-session behavior in an integration package or reject with diagnostics; they should not be disguised as relation nodes.
