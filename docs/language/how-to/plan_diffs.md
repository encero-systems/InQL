# Compare two plans

Use a plan diff when you want to review how a relational plan changed as structured evidence. A plan diff can catch output field changes, lineage changes, adapter requirement changes, bundle evidence changes, and unknown impact without relying on text diffs or backend-specific execution plans.

## Compare two lazy plans

```incan
from pub::incql import diff_lazy_plans

before_diff_target = query {
    FROM orders
    GROUP BY .customer_id
    SELECT
        .customer_id as customer_id,
        sum(.amount) as total_amount,
}

after_diff_target = query {
    FROM orders
    GROUP BY .status
    SELECT
        .status as status,
        avg(.amount) as avg_amount,
    ORDER BY desc(.avg_amount)
}

diff = diff_lazy_plans(before_diff_target, after_diff_target)
```

`diff_lazy_plans(...)` inspects both plans, compares their structured evidence, and returns a `PlanDiff`. It reports local facts such as removed output fields, added output fields, lineage changes, and new adapter requirements.

```incan
for record in diff.changed_output_fields():
    println(f"{record.kind.value()}: {record.name}")

if diff.has_breaking_changes():
    println("local breaking change detected")
```

Removing an output field is classified as locally breaking because a downstream consumer expecting that field can fail. Adding a field is classified conservatively as potentially breaking because strict consumers may enforce exact schemas.

## Compare existing inspections

If you already inspected the plans, compare the inspection artifacts directly.

```incan
from pub::incql import diff_plans, inspect_plan

before_inspection = inspect_plan(before_diff_target)
after_inspection = inspect_plan(after_diff_target)

diff = diff_plans(before_inspection, after_inspection)
```

This avoids inspecting the same plans twice in CI or review tools that already need the inspection records for reports.

## Compare governed bundles

Use `diff_plan_bundles(...)` when caller-supplied evidence matters. Bundle diffs include quality assertions, quality observations, execution observations, adapter coverage records, bundle section states, and evidence references in addition to inspection-derived evidence.

```incan
from pub::incql import diff_plan_bundles, governed_plan_bundle, row_count, unique

before_bundle = governed_plan_bundle(before_diff_target, quality_assertions=[row_count(Some(1))])
after_bundle = governed_plan_bundle(
    after_diff_target,
    quality_assertions=[row_count(Some(1)), unique(.status)],
    evidence_refs=["ci:orders-rollup"],
)

bundle_diff = diff_plan_bundles(before_bundle, after_bundle)
```

The bundle diff reports both plan evidence changes and evidence-package changes. For example, a new `unique(.status)` assertion appears as a `QualityAssertion` record, while a new evidence reference appears as an `EvidenceReference` record.

## Use blast-radius inputs

Every non-unchanged diff record produces a local `BlastRadiusInput`. These records are deliberately local: they name affected IncQL semantic target IDs and adapter requirement changes, but they do not claim to know every dashboard, job, model, or consumer outside IncQL.

```incan
for impact in diff.blast_radius_inputs:
    println(f"{impact.family.value()} {impact.compatibility.value()}")
    for target_id in impact.affected_target_ids:
        println(target_id)
```

Downstream tooling can combine these records with its own dependency graph, catalog, deployment metadata, or approval workflow. IncQL’s responsibility is to provide conservative structured evidence, not to own a global blast-radius service.

## Handle unknown impact

Unknown impact is not success. If two artifacts cannot be compared safely, `diff.unknown_impacts()` returns explicit records.

```incan
unknown = diff.unknown_impacts()
if len(unknown) > 0:
    println("manual review required")
```

Common reasons include incompatible schema versions or evidence families that are present but not comparable by the current diff schema. Treat these records as review inputs rather than ignoring them.
