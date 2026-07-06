# Package a governed plan bundle

Use a governed plan bundle when a local tool, CI job, notebook, or migration assistant needs one handoff value that keeps a planned relation and its evidence together. The bundle does not make policy decisions. It gives consumers a typed package with explicit section states, so missing quality observations, absent coverage records, and unsupported reserved evidence families cannot be mistaken for successful evidence.

## Build a bundle from a lazy plan

```incan
from pub::inql import governed_plan_bundle

bundle = governed_plan_bundle(summary)

println(bundle.bundle_id)
println(bundle.section_available("lineage_graph"))
```

`governed_plan_bundle(summary)` inspects the `LazyFrame` and packages the inspection evidence: plan targets, input schema references, output schema, output fields, lineage, metadata attachments, governed attributes, policy checkpoints, adapter requirements, and unsupported-evidence markers.

## Include quality and coverage evidence

Caller-owned evidence can be included at creation time. This keeps inspection evidence, quality declarations, quality outcomes, execution attempts, and adapter coverage records together without making inspection execute the plan.

```incan
from pub::inql import Session, governed_plan_bundle, row_count

mut session = Session.default()
orders = session.read_csv[Order]("orders", "orders.csv")?
summary = query {
    FROM orders
    GROUP BY .region
    SELECT
        .region as region,
        sum(.amount) as total_amount,
}

assertions = [row_count(Some(1)).require()]
quality = session.observe_quality(summary.clone(), assertions)
coverage = session.check_plan_coverage(summary.clone())

bundle = governed_plan_bundle(
    summary,
    quality_assertions=assertions,
    quality_observations=quality,
    coverage_records=coverage,
    evidence_refs=["ci:orders-summary"],
)
```

The bundle records `quality_assertions`, `quality_observations`, and `coverage_records` as available sections because the caller supplied them. Semantic profiles, profile assessments, and ingress evidence follow the same rule when supplied. If those arguments are omitted, the sections remain present but `Unavailable`.

## Include ingress evidence

When a plan came through a frontend boundary, package the ingress analysis evidence with the inspection result. This preserves request identity, client-session context, origin mappings, frontend coverage, and diagnostics beside the normal Prism evidence.

```incan
from pub::inql import (
    analyze_ingress_plan,
    governed_plan_bundle_from_inspection,
    ingress_named_table,
    ingress_plan,
    inspect_plan,
)

plan = ingress_plan(request, session_context, [ingress_named_table("orders")])
analysis: IngressAnalysis[Order] = analyze_ingress_plan[Order](plan)

match analysis.plan:
    Some(data) =>
        bundle = governed_plan_bundle_from_inspection(
            inspect_plan(data),
            ingress_evidence=[analysis.evidence],
        )
        println(bundle.section_available("frontend_coverage"))
    None => println("ingress analysis rejected the plan")
```

Ingress evidence is frontend-facing. It should be reviewed alongside, not instead of, adapter coverage records.

## Branch on section state

Do not treat an absent or zero-count section as a successful check. Look at `availability`.

```incan
match bundle.section("coverage_records"):
    Some(section) =>
        match section.availability:
            BundleSectionAvailability.Available => println(f"coverage records: {section.record_count}")
            BundleSectionAvailability.Unavailable => println(section.reason)
            BundleSectionAvailability.Unsupported => println("coverage section is unsupported")
    None => println("unknown bundle section")
```

Reserved evidence families such as verification evidence, digest profiles, proof artifacts, constraint evidence, data contract evidence, semantic graph projections, and exchange bridges are represented as explicit `Unsupported` sections until their owning RFCs add concrete records. That is intentional: consumers can distinguish “not implemented here” from “implemented but not supplied for this bundle.” Ingress sections are concrete optional sections; they are `Available` only when callers supply ingress evidence.

## Write a JSON summary

The typed bundle is the richest representation. When a tool only needs summary metadata and section states, write the stable JSON summary.

```incan
bundle.write("target/inql/summary.bundle.json")?
```

The JSON file contains bundle metadata, plan/root target summaries, counts, section records, input schema references, and evidence references. It does not flatten every rich nested evidence record. Keep the typed bundle in memory when the consumer needs full lineage edges, governed attributes, quality records, execution observations, coverage diagnostics, semantic profiles, or profile assessments.
