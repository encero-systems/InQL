# Inspect a plan and lineage graph

This how-to shows how to inspect a Prism-backed lazy plan without executing it.

Use `inspect_plan(...)` when you need the full inspection record. Use `inspect_lineage(...)` when you only need the lineage graph.

## Build a lazy plan

```incan
from pub::inql import LazyFrame
from pub::inql.functions import col, eq, str_lit, sum
from models import Order

def paid_spend_summary(orders: LazyFrame[Order]) -> LazyFrame[Order]:
    return (
        orders
            .filter(eq(col("status"), str_lit("paid")))
            .group_by([col("customer_id")])
            .agg([sum(col("amount"))])
    )
```

## Inspect the plan

```incan
from pub::inql import inspect_plan

summary = paid_spend_summary(orders)
inspection = inspect_plan(summary)

println(inspection.plan_id)
println(inspection.output_fields[0].name)
```

`inspect_plan(...)` does not execute the plan. It reads the local Prism state behind the lazy carrier and returns plan targets, output fields, Prism nodes, lineage, artifacts, diagnostics, and unsupported-evidence markers.

## Read lineage directly

```incan
from pub::inql import inspect_lineage

lineage = inspect_lineage(summary)

for edge in lineage.edges:
    println(edge.relationship.value())
```

Lineage is plan-local evidence. It explains how the authored plan relates fields and relations before backend binding or execution. For exact record fields and current limits, see [Local inspection (Reference)](../reference/inspection.md).
