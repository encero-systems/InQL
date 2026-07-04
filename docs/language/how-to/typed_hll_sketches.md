# Build typed HyperLogLog sketches

This how-to shows how to create, merge, and estimate typed HyperLogLog sketch state.

Use sketch helpers when approximate state itself needs to flow through a plan. Use `approx_count_distinct(...)` when the plan only needs one aggregate estimate.

## Build daily sketches

Aggregate source values into typed sketch state with `hll_sketch(...)`.

```incan
from pub::inql.functions import col, hll_sketch

daily = events.group_by([col("event_date")]).agg([
    hll_sketch(col("user_id"), precision=14),
])

literal_seed = events.group_by([col("event_date")]).agg([
    hll_sketch("anonymous-user", precision=14),
])
```

## Merge and estimate sketches

Reference sketch columns with matching logical type metadata, then merge and estimate them.

```incan
from pub::inql.sketches import hll_estimate, hll_merge, hll_type, sketch_col

monthly = daily.group_by([col("month")]).agg([
    hll_merge(sketch_col("hll_sketch_user_id", hll_type(precision=14))),
])

reported = monthly.with_column(
    "estimated_users",
    hll_estimate(sketch_col("hll_merge_hll_sketch_user_id", hll_type(precision=14))),
)
```

Sketches can merge only when family, value domain, precision, and serialization format match. For exact helper contracts, see [Sketch functions](../reference/functions/sketches.md).
